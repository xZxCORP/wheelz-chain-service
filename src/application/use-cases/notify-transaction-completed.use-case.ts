import type { Status, VehicleTransactionCompleted } from '@zcorp/shared-typing-wheelz';

import type { DateProviderPort } from '../ports/date-provider.port.js';
import type { QueuePort } from '../ports/queue.port.js';

export class NotifyTransactionCompletedUseCase {
  constructor(
    private completedQueue: QueuePort,
    private dateProvider: DateProviderPort
  ) {}
  async execute(transactionId: string, status: Status) {
    const message: VehicleTransactionCompleted = {
      transactionId,
      newStatus: status,
      completedAt: this.dateProvider.now(),
    };
    return await this.completedQueue.enqueue(message);
  }
}
