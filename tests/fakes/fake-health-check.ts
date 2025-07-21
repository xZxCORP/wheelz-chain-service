import type { ServiceHealthStatus } from '@zcorp/shared-typing-wheelz';

import type { HealthCheckPort } from '../../src/application/ports/health-check.port.js';

export class FakeHealthCheck implements HealthCheckPort {
  constructor(
    public readonly name: string,
    private readonly shouldBeHealthy: boolean = true,
    private readonly message?: string
  ) {}

  async isHealthy(): Promise<ServiceHealthStatus> {
    if (this.shouldBeHealthy) {
      return {
        name: this.name,
        status: 'healthy',
      };
    }
    return {
      name: this.name,
      status: 'unhealthy',
      message: this.message ?? 'Service is unhealthy',
    };
  }
}
