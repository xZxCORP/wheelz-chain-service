import type { HealthStatus, OverallHealthStatus } from '@zcorp/shared-typing-wheelz';

import type { HealthCheckPort } from '../ports/health-check.port.js';

export class PerformHealthCheckUseCase {
  constructor(private healthChecks: HealthCheckPort[]) {}

  async execute(): Promise<OverallHealthStatus> {
    const results = await Promise.all(
      this.healthChecks.map(async (check) => {
        try {
          return await check.isHealthy();
        } catch (error) {
          return {
            name: check.name,
            status: 'unhealthy' as HealthStatus,
            message: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    const isOverallHealthy = results.every((result) => result.status === 'healthy');
    const status: HealthStatus = isOverallHealthy ? 'healthy' : 'unhealthy';

    return {
      status,
      services: results,
    };
  }
}
