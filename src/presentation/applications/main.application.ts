import { ChainService } from '../../application/services/chain.service.js';
import { CreateBlockUseCase } from '../../application/use-cases/create-block.use-case.js';
import { CreateGenesisBlockUseCase } from '../../application/use-cases/create-genesis-block.use-case.js';
import { IsChainInitializedUseCase } from '../../application/use-cases/is-chain-initialized.use-case.js';
import { PerformHealthCheckUseCase } from '../../application/use-cases/perform-health-check.use-case.js';
import { VerifyChainUseCase } from '../../application/use-cases/verify-chain.use-case.js';
import { BlockDataPreparationService } from '../../domain/service/block-data-preparation.service.js';
import { EnvironmentConfigLoader } from '../../infrastructure/adapters/config/environment.config-loader.js';
import { RealDateProvider } from '../../infrastructure/adapters/date/real.date-provider.js';
import { Sha256Hasher } from '../../infrastructure/adapters/hasher/sha256.hasher.js';
import { ChainRepositoryHealthCheck } from '../../infrastructure/adapters/health-check/chain-repository.health-check.js';
import { TransactionQueueHealthCheck } from '../../infrastructure/adapters/health-check/transaction-queue.health-check.js';
import { UuidIdGenerator } from '../../infrastructure/adapters/id-generator/uuid.id-generator.js';
import { WinstonLogger } from '../../infrastructure/adapters/logger/winston.logger.js';
import { RabbitMQTransactionQueue } from '../../infrastructure/adapters/queue/rabbit-mq.transaction-queue.js';
import { MongoDBChainRepository } from '../../infrastructure/repositories/mongodb-chain.repository.js';
import { FastifyApiServer } from '../api/servers/fastify-api-server.js';
import { HealthcheckController } from '../controllers/healthcheck.controller.js';
import { AbstractApplication } from './base.application.js';

export class MainApplication extends AbstractApplication {
  private chainService!: ChainService;
  async initializeResources(): Promise<void> {
    const transactionQueue = new RabbitMQTransactionQueue(
      this.config.transactionQueue.url,
      this.config.transactionQueue.queueName,
      this.logger
    );
    const chainRepository = new MongoDBChainRepository(
      this.config.chain.uri,
      this.config.chain.databaseName,
      this.config.chain.collectionName,
      this.logger
    );
    const dateProvider = new RealDateProvider();
    const hasher = new Sha256Hasher();
    const idGenerator = new UuidIdGenerator();

    const blockDataPreparationService = new BlockDataPreparationService();

    const createBlockUseCase = new CreateBlockUseCase(
      chainRepository,
      dateProvider,
      hasher,
      idGenerator,
      blockDataPreparationService
    );
    const verifyChainUseCase = new VerifyChainUseCase(
      chainRepository,
      blockDataPreparationService,
      hasher
    );
    const isChainInitializedUseCase = new IsChainInitializedUseCase(chainRepository);
    const createGenesisBlockUseCase = new CreateGenesisBlockUseCase(
      chainRepository,
      hasher,
      dateProvider,
      idGenerator
    );

    this.chainService = new ChainService(
      createBlockUseCase,
      verifyChainUseCase,
      isChainInitializedUseCase,
      createGenesisBlockUseCase,
      transactionQueue
    );
    const performHealthCheckUseCase = new PerformHealthCheckUseCase([
      new TransactionQueueHealthCheck(transactionQueue),
      new ChainRepositoryHealthCheck(chainRepository),
    ]);
    const healthcheckController = new HealthcheckController(performHealthCheckUseCase);
    const api = new FastifyApiServer(this.config, healthcheckController);

    this.managedResources = [transactionQueue, chainRepository, api];
  }

  static async create(): Promise<MainApplication> {
    const configLoader = new EnvironmentConfigLoader();
    const config = await configLoader.load();
    return new MainApplication(
      config,
      new WinstonLogger({
        logLevel: config.logLevel,
        pretty: true,
      })
    );
  }
  override async initialize(): Promise<void> {
    await super.initialize();
    await this.chainService.initializeChain();
  }
}
