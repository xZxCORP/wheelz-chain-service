import { queueTransactionSchema, type VehicleTransaction } from '@zcorp/shared-typing-wheelz';

import type { TransactionRepository } from '../../domain/repositories/transaction.repository.js';
import type { QueuePort } from '../ports/queue.port.js';

export class DequeueTransactionsUseCase {
  constructor(
    private readonly transactionQueue: QueuePort,
    private readonly transactionRepository: TransactionRepository
  ) {}
  async execute(batchSize: number): Promise<VehicleTransaction[]> {
    const data = await this.transactionQueue.dequeue(batchSize);
    const result = await queueTransactionSchema.array().safeParseAsync(data);
    if (result.success) {
      const mappedTransactions = await Promise.all(
        result.data.map((item) => this.transactionRepository.getById(item.transactionId))
      );
      return mappedTransactions.filter((item) => item !== null);
    }
    return [];
  }
}
