import { type QueueTransaction, queueTransactionSchema } from '@zcorp/shared-typing-wheelz';

import type { QueuePort } from '../ports/queue.port.js';

export class DequeueTransactionsUseCase {
  constructor(private readonly transactionQueue: QueuePort) {}
  async execute(batchSize: number): Promise<QueueTransaction[]> {
    const data = this.transactionQueue.dequeue(batchSize);
    const result = await queueTransactionSchema.array().safeParseAsync(data);
    if (result.success) {
      return result.data;
    }
    return [];
  }
}
