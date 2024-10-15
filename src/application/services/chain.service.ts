import type { TransactionQueuePort } from '../ports/transaction-queue.port.js';
import type { CreateBlockUseCase } from '../use-cases/create-block.use-case.js';
import type { VerifyChainUseCase } from '../use-cases/verify-chain.use-case.js';

export class ChainService {
  constructor(
    private createBlockUseCase: CreateBlockUseCase,
    private verifyChainUseCase: VerifyChainUseCase,
    private transactionQueue: TransactionQueuePort
  ) {}

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
