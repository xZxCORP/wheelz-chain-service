import { PerformHealthCheckUseCase } from '../../application/use-cases/perform-health-check.use-case.js';

export class HealthcheckController {
  constructor(private readonly performHealthCheckUseCase: PerformHealthCheckUseCase) {}

  healthcheck() {
    return this.performHealthCheckUseCase.execute();
  }
}
