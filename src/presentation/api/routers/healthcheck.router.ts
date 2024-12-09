import type { ServerInferRequest, ServerInferResponses } from '@ts-rest/core';
import type { transactionContract } from '@zcorp/wheelz-contracts';

import type { HealthcheckController } from '../../controllers/healthcheck.controller.js';

export class HealthcheckRouter {
  constructor(private readonly healthcheckController: HealthcheckController) {}

  health = async (
    _input: ServerInferRequest<typeof transactionContract.health.health>
  ): Promise<ServerInferResponses<typeof transactionContract.health.health>> => {
    const result = await this.healthcheckController.healthcheck();
    return {
      status: result.status === 'healthy' ? 200 : 502,
      body: result,
    };
  };
}
