import type { ServiceHealthStatus } from '@zcorp/shared-typing-wheelz';

import type { HealthCheckPort } from '../../../application/ports/health-check.port.js';
import type { ChainRepository } from '../../../domain/repositories/chain.repository.js';

export class ChainRepositoryHealthCheck implements HealthCheckPort {
  name = 'chain';

  constructor(private chainRepository: ChainRepository) {}

  async isHealthy(): Promise<ServiceHealthStatus> {
    const isRunning = await this.chainRepository.isRunning();
    if (isRunning) {
      return {
        name: this.name,
        status: 'healthy',
      };
    } else {
      return {
        name: this.name,
        status: 'unhealthy',
        message: 'Chain is not running',
      };
    }
  }
}
