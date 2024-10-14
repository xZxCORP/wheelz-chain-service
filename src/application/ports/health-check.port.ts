import type { ServiceHealthStatus } from '@zcorp/shared-typing-wheelz';

export interface HealthCheckPort {
  name: string;

  isHealthy(): Promise<ServiceHealthStatus>;
}
