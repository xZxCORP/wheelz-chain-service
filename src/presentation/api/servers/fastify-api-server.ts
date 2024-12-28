import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { initServer } from '@ts-rest/fastify';
import { authPlugin, requireAuth } from '@zcorp/shared-fastify';
import { chainContract } from '@zcorp/wheelz-contracts';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';

import type { ManagedResource } from '../../../infrastructure/managed.resource.js';
import type { Config } from '../../../infrastructure/ports/config-loader.port.js';
import type { ChainController } from '../../controllers/chain.controller.js';
import type { HealthcheckController } from '../../controllers/healthcheck.controller.js';
import { openApiDocument } from '../open-api.js';
import { ChainRouter } from '../routers/chain.router.js';
import { HealthcheckRouter } from '../routers/healthcheck.router.js';

export class FastifyApiServer implements ManagedResource {
  fastifyInstance: FastifyInstance;
  private healthcheckRouter: HealthcheckRouter;
  private chainRouter: ChainRouter;

  constructor(
    private config: Config,
    private healthcheckController: HealthcheckController,
    private chainController: ChainController
  ) {
    const server = initServer();
    this.fastifyInstance = Fastify({
      logger: {
        transport: {
          target: 'pino-pretty',
          options: {
            translateTime: 'HH:MM:ss Z',
            ignore: 'pid,hostname',
          },
        },
      },
    });
    this.fastifyInstance.register(cors, {
      origin: '*',
    });
    this.fastifyInstance.register(authPlugin, {
      authServiceUrl: config.authService.url,
    });

    this.healthcheckRouter = new HealthcheckRouter(this.healthcheckController);
    this.chainRouter = new ChainRouter(this.chainController);

    this.fastifyInstance.setErrorHandler((error, request, reply) => {
      reply.status(error.statusCode ?? 500).send({ message: error.message, data: error.cause });
    });

    server.registerRouter(
      chainContract.health,
      {
        health: this.healthcheckRouter.health,
      },
      this.fastifyInstance
    );
    server.registerRouter(
      chainContract.chain,
      {
        getVehicleOfTheChain: {
          handler: this.chainRouter.getVehicleOfTheChain,
          hooks: {
            onRequest: [requireAuth()],
          },
        },
        getAllVehiclesOfTheChain: {
          handler: this.chainRouter.getAllVehiclesOfTheChain,
          hooks: {
            //TODO: adding admin role
            onRequest: [requireAuth()],
          },
        },
        refreshChainState: {
          handler: this.chainRouter.refreshChainState,
          hooks: {
            //TODO: adding admin role
            onRequest: [requireAuth()],
          },
        },
        processTransactionBatch: {
          handler: this.chainRouter.processTransactionBatch,
          hooks: {
            //TODO: adding admin role
            onRequest: [requireAuth()],
          },
        },
        verifyChainState: {
          handler: this.chainRouter.verifyChainState,
          hooks: {
            //TODO: adding admin role
            onRequest: [requireAuth()],
          },
        },
        stats: {
          handler: this.chainRouter.stats,
          hooks: {
            //TODO: adding admin role
            onRequest: [requireAuth()],
          },
        },
      },
      this.fastifyInstance
    );

    this.fastifyInstance
      .register(fastifySwagger, {
        transformObject: () => ({
          ...openApiDocument,
          security: [{ BearerAuth: [] }],
          components: {
            securitySchemes: {
              BearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
              },
            },
          },
        }),
      })
      .register(fastifySwaggerUI, {
        routePrefix: '/ui',
        uiConfig: {
          docExpansion: 'list',
          deepLinking: true,
          persistAuthorization: true,
        },
      });
  }

  async initialize() {
    await this.fastifyInstance.listen({ port: this.config.api.port, host: this.config.api.host });
  }

  async dispose(): Promise<void> {
    await this.fastifyInstance.close();
  }
}
