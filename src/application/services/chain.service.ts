import type { TransactionQueuePort } from '../ports/transaction-queue.port.js';
import type { CreateBlockUseCase } from '../use-cases/create-block.use-case.js';
import type { CreateGenesisBlockUseCase } from '../use-cases/create-genesis-block.use-case.js';
import type { IsChainInitializedUseCase } from '../use-cases/is-chain-initialized.use-case.js';
import type { VerifyChainUseCase } from '../use-cases/verify-chain.use-case.js';

export class ChainService {
  constructor(
    private createBlockUseCase: CreateBlockUseCase,
    private verifyChainUseCase: VerifyChainUseCase,
    private readonly isChainInitializedUseCase: IsChainInitializedUseCase,
    private readonly createGenesisBlockUseCase: CreateGenesisBlockUseCase,
    private transactionQueue: TransactionQueuePort
  ) {}
  async initializeChain(): Promise<void> {
    const isChainInitialized = await this.isChainInitializedUseCase.execute();
    if (!isChainInitialized) {
      await this.createGenesisBlockUseCase.execute();
    }
  }

  async processTransactionBatch(batchSize: number = 10): Promise<void> {
    const transactions = await this.transactionQueue.dequeue(batchSize);
    if (transactions.length > 0) {
      await this.createBlockUseCase.execute(transactions);
    }
  }

  async verifyChain(): Promise<boolean> {
    return this.verifyChainUseCase.execute();
  }
}
