import type { ServiceHealthStatus } from '@zcorp/shared-typing-wheelz';

import type { HealthCheckPort } from '../../../application/ports/health-check.port.js';
import type { TransactionQueuePort } from '../../../application/ports/transaction-queue.port.js';

export class TransactionQueueHealthCheck implements HealthCheckPort {
  name = 'transactionQueue';

  constructor(private transactionQueue: TransactionQueuePort) {}

  async isHealthy(): Promise<ServiceHealthStatus> {
    const isRunning = await this.transactionQueue.isRunning();
    if (isRunning) {
      return {
        name: this.name,
        status: 'healthy',
      };
    } else {
      return {
        name: this.name,
        status: 'unhealthy',
        message: 'Transaction queue is not running',
      };
    }
  }
}
