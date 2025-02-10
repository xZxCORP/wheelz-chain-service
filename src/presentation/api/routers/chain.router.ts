import type { ServerInferRequest, ServerInferResponses } from '@ts-rest/core';
import type { chainContract } from '@zcorp/wheelz-contracts';
import type { FastifyRequest } from 'fastify';

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
    input: ServerInferRequest<typeof chainContract.chain.getAllVehiclesOfTheChain>,
    request: FastifyRequest
  ): Promise<ServerInferResponses<typeof chainContract.chain.getAllVehiclesOfTheChain>> => {
    const result = await this.chainController.getVehiclesOfTheChain(
      input.query,
      String(request.user!.userId),
      request.user!.roles,
      String(request.user!.companyId)
    );
    return {
      status: 200,
      body: result,
    };
  };
  refreshChainState = async (
    _input: ServerInferRequest<typeof chainContract.chain.refreshChainState>
  ): Promise<ServerInferResponses<typeof chainContract.chain.refreshChainState>> => {
    await this.chainController.refreshChain();
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
    await this.chainController.processTransactionBatch(input.body.count ?? 10);
    return {
      status: 200,
      body: {
        message: 'Processed',
      },
    };
  };
  verifyChainState = async (
    _input: ServerInferRequest<typeof chainContract.chain.verifyChainState>
  ): Promise<ServerInferResponses<typeof chainContract.chain.verifyChainState>> => {
    const result = await this.chainController.verifyChain();
    if (!result) {
      return {
        status: 500,
        body: {
          message: "La chaine n'est pas valide",
        },
      };
    }
    return {
      status: 200,
      body: {
        message: 'La chaine est valide',
      },
    };
  };
  stats = async (
    _input: ServerInferRequest<typeof chainContract.chain.stats>
  ): Promise<ServerInferResponses<typeof chainContract.chain.stats>> => {
    const result = await this.chainController.getChainStats();
    return {
      status: 200,
      body: result,
    };
  };
}
