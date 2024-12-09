import type { ServiceHealthStatus } from '@zcorp/shared-typing-wheelz';

import type { HealthCheckPort } from '../../../application/ports/health-check.port.js';
import type { ChainStateRepository } from '../../../domain/repositories/chain-state.repository.js';

export class ChainStateRepositoryHealthCheck implements HealthCheckPort {
  name = 'chainState';

  constructor(private chainStateRepository: ChainStateRepository) {}

  async isHealthy(): Promise<ServiceHealthStatus> {
    const isRunning = await this.chainStateRepository.isRunning();
    if (isRunning) {
      return {
        name: this.name,
        status: 'healthy',
      };
    } else {
      return {
        name: this.name,
        status: 'unhealthy',
        message: 'Chain State is not running',
      };
    }
  }
}
