import type { HealthStatus, OverallHealthStatus } from '@zcorp/shared-typing-wheelz';

import type { HealthCheckPort } from '../ports/health-check.port.js';

export class PerformHealthCheckUseCase {
  constructor(private healthChecks: HealthCheckPort[]) {}

  async execute(): Promise<OverallHealthStatus> {
    const checkers = await Promise.all(this.healthChecks.map((check) => check.isHealthy()));
    const isOverallHealthy = checkers.every((result) => result.status === 'healthy');
    const status: HealthStatus = isOverallHealthy ? 'healthy' : 'unhealthy';
    return {
      status,
      services: checkers,
    };
  }
}
