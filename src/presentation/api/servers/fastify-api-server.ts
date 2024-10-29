import cors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUI from '@fastify/swagger-ui';
import { initServer } from '@ts-rest/fastify';
import { chainContract } from '@zcorp/wheelz-contracts';
import type { FastifyInstance } from 'fastify';
import Fastify from 'fastify';

import type { ManagedResource } from '../../../infrastructure/managed.resource.js';
import type { Config } from '../../../infrastructure/ports/config-loader.port.js';
import type { HealthcheckController } from '../../controllers/healthcheck.controller.js';
import { openApiDocument } from '../open-api.js';
import { HealthcheckRouter } from '../routers/healthcheck.router.js';

export class FastifyApiServer implements ManagedResource {
  fastifyInstance: FastifyInstance;
  private healthcheckRouter: HealthcheckRouter;

  constructor(
    private config: Config,
    private healthcheckController: HealthcheckController
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
    this.healthcheckRouter = new HealthcheckRouter(this.healthcheckController);

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

    this.fastifyInstance
      .register(fastifySwagger, {
        transformObject: () => openApiDocument,
      })
      .register(fastifySwaggerUI, {
        routePrefix: '/ui',
      });
  }

  async initialize() {
    await this.fastifyInstance.listen({ port: this.config.api.port, host: this.config.api.host });
  }

  async dispose(): Promise<void> {
    await this.fastifyInstance.close();
  }
}
