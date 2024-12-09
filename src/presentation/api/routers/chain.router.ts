import type { ServerInferRequest, ServerInferResponses } from '@ts-rest/core';
import type { chainContract } from '@zcorp/wheelz-contracts';

import type { ChainController } from '../../controllers/chain.controller.js';

export class ChainRouter {
  constructor(private readonly chainController: ChainController) {}

  getVehicleOfTheChain = async (
    _input: ServerInferRequest<typeof chainContract.chain.getVehicleOfTheChain>
  ): Promise<ServerInferResponses<typeof chainContract.chain.getVehicleOfTheChain>> => {
    if (!_input.query.vin && !_input.query.licensePlate) {
      return {
        status: 400,
        body: {
          message: 'Missing vin or license plate',
        },
      };
    }
    if (_input.query.vin) {
      const result = await this.chainController.getVehicleOfTheChainByVin(_input.query.vin);
      if (!result) {
        return {
          status: 404,
          body: {
            message: 'Vehicle not found',
          },
        };
      }
      return {
        status: 200,
        body: result,
      };
    }
    const result = await this.chainController.getVehicleOfTheChainByLicensePlate(
      _input.query.licensePlate!
    );
    if (!result) {
      return {
        status: 404,
        body: {
          message: 'Vehicle not found',
        },
      };
    }
    return { status: 200, body: result };
  };
}
