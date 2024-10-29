import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';

import type { LoggerPort } from '../ports/logger.port.js';
import type { CreateBlockUseCase } from '../use-cases/create-block.use-case.js';
import type { CreateGenesisBlockUseCase } from '../use-cases/create-genesis-block.use-case.js';
import type { DeleteBlocksUseCase } from '../use-cases/delete-blocks.use-case.js';
import type { DequeueTransactionsUseCase } from '../use-cases/dequeue-transactions.use-case.js';
import type { GetBlocksUseCase } from '../use-cases/get-blocks.use-case.js';
import type { IsChainInitializedUseCase } from '../use-cases/is-chain-initialized.use-case.js';
import type { NotifyTransactionCompletedUseCase } from '../use-cases/notify-transaction-completed.use-case.js';
import type { VerifyBlockPairUseCase } from '../use-cases/verify-block-pair.use-case.js';
import type { VerifyTransactionUseCase } from '../use-cases/verify-transaction.use-case.js';

export class ChainService {
  constructor(
    private readonly createBlockUseCase: CreateBlockUseCase,
    private readonly getBlocksUseCase: GetBlocksUseCase,
    private readonly deleteBlocksUseCase: DeleteBlocksUseCase,
    private readonly verifyBlockPairUseCase: VerifyBlockPairUseCase,
    private readonly verifyTransactionUseCase: VerifyTransactionUseCase,
    private readonly isChainInitializedUseCase: IsChainInitializedUseCase,
    private readonly createGenesisBlockUseCase: CreateGenesisBlockUseCase,
    private readonly dequeueTransactionsUseCase: DequeueTransactionsUseCase,
    private readonly notifyTransactionCompletedUseCase: NotifyTransactionCompletedUseCase,
    private readonly logger: LoggerPort
  ) {}
  async initializeChain(): Promise<void> {
    const isChainInitialized = await this.isChainInitializedUseCase.execute();
    if (!isChainInitialized) {
      await this.createGenesisBlockUseCase.execute();
    }
  }
  async resetChain(): Promise<void> {
    await this.deleteBlocksUseCase.execute();
    await this.createGenesisBlockUseCase.execute();
  }

  async processTransactionBatch(batchSize: number = 10): Promise<void> {
    const transactions = await this.dequeueTransactionsUseCase.execute(batchSize);
    if (transactions.length > 0) {
      const validTransactions: VehicleTransaction[] = [];
      for (const transaction of transactions) {
        const isValid = await this.verifyTransactionUseCase.execute(transaction);
        if (!isValid) {
          const result = await this.notifyTransactionCompletedUseCase.execute(
            transaction.id,
            'error'
          );
          if (!result) {
            this.logger.error('Failed to notify transaction completed');
          }
          continue;
        }
        validTransactions.push(transaction);
      }
      if (validTransactions.length > 0) {
        await this.createBlockUseCase.execute(validTransactions);
        for (const transaction of validTransactions) {
          this.logger.info(`Processing valid transaction: ${transaction.id}`);
          const result = await this.notifyTransactionCompletedUseCase.execute(
            transaction.id,
            'finished'
          );
          this.logger.info(`Transaction completed: ${transaction.id}`);
          if (!result) {
            this.logger.error('Failed to notify transaction completed');
          }
        }
      } else {
        this.logger.error('No valid transactions');
      }
    } else {
      this.logger.info('No new transactions');
    }
  }
  async verifyTransactions(transactions: VehicleTransaction[]): Promise<boolean> {
    for (const transaction of transactions) {
      if (!this.verifyTransactionUseCase.execute(transaction)) {
        return false;
      }
    }
    return true;
  }

  async verifyChain(): Promise<boolean> {
    const blocks = await this.getBlocksUseCase.execute();
    if (blocks.length === 0) {
      return false;
    }

    for (let index = 1; index < blocks.length; index++) {
      const currentBlock = blocks[index];
      const previousBlock = blocks[index - 1];
      if (!currentBlock || !previousBlock) {
        return false;
      }
      if (!(await this.verifyBlockPairUseCase.execute(currentBlock, previousBlock))) {
        return false;
      }
      if (!(await this.verifyTransactions(currentBlock.transactions))) {
        return false;
      }
    }
    return true;
  }
}
