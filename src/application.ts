import type { LoggerPort } from './application/ports/logger.port.js';
import { ChainService } from './application/services/chain.service.js';
import { CreateBlockUseCase } from './application/use-cases/create-block.use-case.js';
import { CreateGenesisBlockUseCase } from './application/use-cases/create-genesis-block.use-case.js';
import { IsChainInitializedUseCase } from './application/use-cases/is-chain-initialized.use-case.js';
import { PerformHealthCheckUseCase } from './application/use-cases/perform-health-check.use-case.js';
import { VerifyChainUseCase } from './application/use-cases/verify-chain.use-case.js';
import { BlockDataPreparationService } from './domain/service/block-data-preparation.service.js';
import { EnvironmentConfigLoader } from './infrastructure/adapters/config/environment.config-loader.js';
import { RealDateProvider } from './infrastructure/adapters/date/real.date-provider.js';
import { Sha256Hasher } from './infrastructure/adapters/hasher/sha256.hasher.js';
import { ChainRepositoryHealthCheck } from './infrastructure/adapters/health-check/chain-repository.health-check.js';
import { TransactionQueueHealthCheck } from './infrastructure/adapters/health-check/transaction-queue.health-check.js';
import { UuidIdGenerator } from './infrastructure/adapters/id-generator/uuid.id-generator.js';
import { PinoLogger } from './infrastructure/adapters/logger/pino.logger.js';
import { RabbitMQTransactionQueue } from './infrastructure/adapters/queue/rabbit-mq.transaction-queue.js';
import type { ManagedResource } from './infrastructure/managed.resource.js';
import type { Config } from './infrastructure/ports/config-loader.port.js';
import { MongoDBChainRepository } from './infrastructure/repositories/mongodb-chain.repository.js';

export class Application {
  private managedResources: ManagedResource[] = [];
  private chainService: ChainService;

  constructor(
    config: Config,
    private readonly logger: LoggerPort
  ) {
    const transactionQueue = new RabbitMQTransactionQueue(
      config.transactionQueue.url,
      config.transactionQueue.queueName,
      logger
    );
    const chainRepository = new MongoDBChainRepository(
      config.chain.uri,
      config.chain.databaseName,
      config.chain.collectionName,
      logger
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

    this.managedResources = [transactionQueue, chainRepository];
  }
  static async create(): Promise<Application> {
    const configLoader = new EnvironmentConfigLoader();
    const config = await configLoader.load();
    return new Application(config, new PinoLogger(config.logLevel));
  }

  async initialize(): Promise<void> {
    this.logger.info('Initializing application');
    for (const resource of this.managedResources) {
      await resource.initialize();
    }
    await this.chainService.initializeChain();
    this.logger.info('Application initialized');
  }
  async start(): Promise<void> {
    this.logger.info('Starting application');
    await this.initialize();
    this.logger.info('Application started');
  }
  async stop(): Promise<void> {
    this.logger.info('Stopping application');
    for (const resource of this.managedResources) {
      await resource.dispose();
    }
    this.logger.info('Application stopped');
  }
}
