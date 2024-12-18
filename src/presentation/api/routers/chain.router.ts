import type { ServerInferRequest, ServerInferResponses } from '@ts-rest/core';
import type { chainContract } from '@zcorp/wheelz-contracts';

import type { ChainController } from '../../controllers/chain.controller.js';

export class ChainRouter {
  constructor(private readonly chainController: ChainController) {}

  getVehicleOfTheChain = async (
    input: ServerInferRequest<typeof chainContract.chain.getVehicleOfTheChain>
  ): Promise<ServerInferResponses<typeof chainContract.chain.getVehicleOfTheChain>> => {
    if (!input.query.vin && !input.query.licensePlate) {
      return {
        status: 400,
        body: {
          message: 'Missing vin or license plate',
        },
      };
    }
    if (input.query.vin) {
      const result = await this.chainController.getVehicleOfTheChainByVin(input.query.vin);
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
      input.query.licensePlate!
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

  getAllVehiclesOfTheChain = async (
    input: ServerInferRequest<typeof chainContract.chain.getAllVehiclesOfTheChain>
  ): Promise<ServerInferResponses<typeof chainContract.chain.getAllVehiclesOfTheChain>> => {
    const result = await this.chainController.getVehiclesOfTheChain(input.query);
    return {
      status: 200,
      body: result,
    };
  };
  refreshChainState = async (
    input: ServerInferRequest<typeof chainContract.chain.refreshChainState>
  ): Promise<ServerInferResponses<typeof chainContract.chain.refreshChainState>> => {
    return {
      status: 200,
      body: {
        message: 'Refreshed',
      },
    };
  };
  processTransactionBatch = async (
    input: ServerInferRequest<typeof chainContract.chain.processTransactionBatch>
  ): Promise<ServerInferResponses<typeof chainContract.chain.processTransactionBatch>> => {
    return {
      status: 200,
      body: {
        message: 'Processed',
      },
    };
  };
}
