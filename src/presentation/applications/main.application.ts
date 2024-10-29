import { ChainService } from '../../application/services/chain.service.js';
import { CreateBlockUseCase } from '../../application/use-cases/create-block.use-case.js';
import { CreateGenesisBlockUseCase } from '../../application/use-cases/create-genesis-block.use-case.js';
import { DeleteBlocksUseCase } from '../../application/use-cases/delete-blocks.use-case.js';
import { DequeueTransactionsUseCase } from '../../application/use-cases/dequeue-transactions.use-case.js';
import { GetBlocksUseCase } from '../../application/use-cases/get-blocks.use-case.js';
import { IsChainInitializedUseCase } from '../../application/use-cases/is-chain-initialized.use-case.js';
import { NotifyTransactionCompletedUseCase } from '../../application/use-cases/notify-transaction-completed.use-case.js';
import { PerformHealthCheckUseCase } from '../../application/use-cases/perform-health-check.use-case.js';
import { VerifyBlockPairUseCase } from '../../application/use-cases/verify-block-pair.use-case.js';
import { VerifyTransactionUseCase } from '../../application/use-cases/verify-transaction.use-case.js';
import { BlockDataPreparationService } from '../../domain/service/block-data-preparation.service.js';
import { EnvironmentConfigLoader } from '../../infrastructure/adapters/config/environment.config-loader.js';
import { CryptoDataSigner } from '../../infrastructure/adapters/data-signer/crypto.data-signer.js';
import { RealDateProvider } from '../../infrastructure/adapters/date/real.date-provider.js';
import { Sha256Hasher } from '../../infrastructure/adapters/hasher/sha256.hasher.js';
import { ChainRepositoryHealthCheck } from '../../infrastructure/adapters/health-check/chain-repository.health-check.js';
import { QueueHealthCheck } from '../../infrastructure/adapters/health-check/queue.health-check.js';
import { UuidIdGenerator } from '../../infrastructure/adapters/id-generator/uuid.id-generator.js';
import { WinstonLogger } from '../../infrastructure/adapters/logger/winston.logger.js';
import { RabbitMQQueue } from '../../infrastructure/adapters/queue/rabbit-mq.queue.js';
import { MongoDBChainRepository } from '../../infrastructure/repositories/mongodb-chain.repository.js';
import { TsRestTransactionRepository } from '../../infrastructure/repositories/ts-rest-transaction.repository.js';
import { FastifyApiServer } from '../api/servers/fastify-api-server.js';
import { HealthcheckController } from '../controllers/healthcheck.controller.js';
import { AbstractApplication } from './base.application.js';

export class MainApplication extends AbstractApplication {
  private chainService!: ChainService;
  async initializeResources(): Promise<void> {
    const transactionQueue = new RabbitMQQueue(
      this.config.transactionQueue.url,
      this.config.transactionQueue.newQueueName,
      this.logger
    );
    const completedQueue = new RabbitMQQueue(
      this.config.transactionQueue.url,
      this.config.transactionQueue.completedQueueName,
      this.logger
    );
    const chainRepository = new MongoDBChainRepository(
      this.config.chain.uri,
      this.config.chain.databaseName,
      this.config.chain.collectionName,
      this.logger
    );
    const transactionRepository = new TsRestTransactionRepository(
      this.config.transactionService.url,
      this.config.authService.url,
      this.config.authService.email,
      this.config.authService.password
    );
    const dateProvider = new RealDateProvider();
    const dataSigner = new CryptoDataSigner(this.config.dataSigner.publicKey);
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
    const getBlocksUseCase = new GetBlocksUseCase(chainRepository);
    const deleteBlocksUseCase = new DeleteBlocksUseCase(chainRepository);
    const verifyBlockPairUseCase = new VerifyBlockPairUseCase(blockDataPreparationService, hasher);
    const verifyTransactionUseCase = new VerifyTransactionUseCase(dataSigner);
    const isChainInitializedUseCase = new IsChainInitializedUseCase(chainRepository);
    const createGenesisBlockUseCase = new CreateGenesisBlockUseCase(
      chainRepository,
      hasher,
      dateProvider,
      idGenerator
    );
    const dequeueTransactionsUseCase = new DequeueTransactionsUseCase(
      transactionQueue,
      transactionRepository
    );
    const notifyTransactionCompletedUseCase = new NotifyTransactionCompletedUseCase(
      completedQueue,
      dateProvider
    );
    this.chainService = new ChainService(
      createBlockUseCase,
      getBlocksUseCase,
      deleteBlocksUseCase,
      verifyBlockPairUseCase,
      verifyTransactionUseCase,
      isChainInitializedUseCase,
      createGenesisBlockUseCase,
      dequeueTransactionsUseCase,
      notifyTransactionCompletedUseCase,
      this.logger
    );
    const performHealthCheckUseCase = new PerformHealthCheckUseCase([
      new QueueHealthCheck(transactionQueue, 'transactionQueue'),
      new QueueHealthCheck(completedQueue, 'completedQueue'),
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
