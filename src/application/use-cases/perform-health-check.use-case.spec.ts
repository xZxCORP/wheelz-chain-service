import type { OverallHealthStatus, ServiceHealthStatus } from '@zcorp/shared-typing-wheelz';
import { describe, expect, it } from 'vitest';

import { FakeHealthCheck } from '../../../tests/fakes/fake-health-check.js';
import type { HealthCheckPort } from '../../application/ports/health-check.port.js';
import { PerformHealthCheckUseCase } from './perform-health-check.use-case.js';

describe('PerformHealthCheckUseCase', () => {
  it('returns healthy status when all services are healthy', async () => {
    // Arrange
    const healthChecks = [
      new FakeHealthCheck('service1', true),
      new FakeHealthCheck('service2', true),
      new FakeHealthCheck('service3', true),
    ];
    const sut = new PerformHealthCheckUseCase(healthChecks);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual<OverallHealthStatus>({
      status: 'healthy',
      services: [
        { name: 'service1', status: 'healthy' },
        { name: 'service2', status: 'healthy' },
        { name: 'service3', status: 'healthy' },
      ],
    });
  });

  it('returns unhealthy status when any service is unhealthy', async () => {
    // Arrange
    const healthChecks = [
      new FakeHealthCheck('service1', true),
      new FakeHealthCheck('service2', false, 'Service 2 is down'),
      new FakeHealthCheck('service3', true),
    ];
    const sut = new PerformHealthCheckUseCase(healthChecks);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual<OverallHealthStatus>({
      status: 'unhealthy',
      services: [
        { name: 'service1', status: 'healthy' },
        { name: 'service2', status: 'unhealthy', message: 'Service 2 is down' },
        { name: 'service3', status: 'healthy' },
      ],
    });
  });

  it('returns healthy status when no health checks are provided', async () => {
    // Arrange
    const sut = new PerformHealthCheckUseCase([]);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual<OverallHealthStatus>({
      status: 'healthy',
      services: [],
    });
  });

  it('returns unhealthy status when multiple services are unhealthy', async () => {
    // Arrange
    const healthChecks = [
      new FakeHealthCheck('service1', false, 'Service 1 failed'),
      new FakeHealthCheck('service2', false, 'Service 2 is down'),
      new FakeHealthCheck('service3', true),
    ];
    const sut = new PerformHealthCheckUseCase(healthChecks);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual<OverallHealthStatus>({
      status: 'unhealthy',
      services: [
        { name: 'service1', status: 'unhealthy', message: 'Service 1 failed' },
        { name: 'service2', status: 'unhealthy', message: 'Service 2 is down' },
        { name: 'service3', status: 'healthy' },
      ],
    });
  });

  it('handles health checks that throw errors', async () => {
    // Arrange
    class ThrowingHealthCheck implements HealthCheckPort {
      name = 'failing-service';
      async isHealthy(): Promise<ServiceHealthStatus> {
        throw new Error('Health check failed');
      }
    }

    const healthChecks = [
      new FakeHealthCheck('service1', true),
      new ThrowingHealthCheck(),
      new FakeHealthCheck('service3', true),
    ];
    const sut = new PerformHealthCheckUseCase(healthChecks);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result.status).toBe('unhealthy');
    expect(result.services).toHaveLength(3);
    expect(result.services[1]).toEqual({
      name: 'failing-service',
      status: 'unhealthy',
      message: 'Health check failed',
    });
  });
});
