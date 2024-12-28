import { CronJob } from 'cron';

import { ChainService } from '../../application/services/chain.service.js';
import { ChainStateService } from '../../application/services/chain-state.service.js';
import { CreateBlockUseCase } from '../../application/use-cases/create-block.use-case.js';
import { CreateGenesisBlockUseCase } from '../../application/use-cases/create-genesis-block.use-case.js';
import { DeleteBlocksUseCase } from '../../application/use-cases/delete-blocks.use-case.js';
import { DequeueTransactionsUseCase } from '../../application/use-cases/dequeue-transactions.use-case.js';
import { GetBlocksUseCase } from '../../application/use-cases/get-blocks.use-case.js';
import { GetChainStatsUseCase } from '../../application/use-cases/get-chain-stats.use-case.js';
import { GetVehicleOfTheChainByLicensePlate } from '../../application/use-cases/get-vehicle-of-the-chain-by-licence-plate.js';
import { GetVehicleOfTheChainByVin } from '../../application/use-cases/get-vehicle-of-the-chain-by-vin.js';
import { GetVehiclesOfTheChain } from '../../application/use-cases/get-vehicles-of-the-chain.use-case.js';
import { IsChainInitializedUseCase } from '../../application/use-cases/is-chain-initialized.use-case.js';
import { NotifyTransactionCompletedUseCase } from '../../application/use-cases/notify-transaction-completed.use-case.js';
import { PerformHealthCheckUseCase } from '../../application/use-cases/perform-health-check.use-case.js';
import { PersistTransactionToChainStateUseCase } from '../../application/use-cases/persist-transaction-to-chain-state.use-case.js';
import { ResetChainStateUseCase } from '../../application/use-cases/reset-chain-state.use-case.js';
import { VerifyBlockPairUseCase } from '../../application/use-cases/verify-block-pair.use-case.js';
import { VerifyTransactionUseCase } from '../../application/use-cases/verify-transaction.use-case.js';
import { BlockDataPreparationService } from '../../domain/service/block-data-preparation.service.js';
import { EnvironmentConfigLoader } from '../../infrastructure/adapters/config/environment.config-loader.js';
import { CryptoDataSigner } from '../../infrastructure/adapters/data-signer/crypto.data-signer.js';
import { RealDateProvider } from '../../infrastructure/adapters/date/real.date-provider.js';
import { Sha256Hasher } from '../../infrastructure/adapters/hasher/sha256.hasher.js';
import { ChainRepositoryHealthCheck } from '../../infrastructure/adapters/health-check/chain-repository.health-check.js';
import { ChainStateRepositoryHealthCheck } from '../../infrastructure/adapters/health-check/chain-state-repository.health-check.js';
import { QueueHealthCheck } from '../../infrastructure/adapters/health-check/queue.health-check.js';
import { UuidIdGenerator } from '../../infrastructure/adapters/id-generator/uuid.id-generator.js';
import { WinstonLogger } from '../../infrastructure/adapters/logger/winston.logger.js';
import { RabbitMQQueue } from '../../infrastructure/adapters/queue/rabbit-mq.queue.js';
import { KyselyChainStateRepository } from '../../infrastructure/repositories/chain-state/kysely/kysely-chain-state.repository.js';
import { MongoDBChainRepository } from '../../infrastructure/repositories/mongodb-chain.repository.js';
import { TsRestTransactionRepository } from '../../infrastructure/repositories/ts-rest-transaction.repository.js';
import { FastifyApiServer } from '../api/servers/fastify-api-server.js';
import { ChainController } from '../controllers/chain.controller.js';
import { HealthcheckController } from '../controllers/healthcheck.controller.js';
import { AbstractApplication } from './base.application.js';
export class MainApplication extends AbstractApplication {
  private chainService!: ChainService;
  private chainStateService!: ChainStateService;
  private jobs: CronJob[] = [];
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
    const chainStateRepository = new KyselyChainStateRepository(
      {
        database: this.config.chainState.databaseName,
        username: this.config.chainState.username,
        password: this.config.chainState.password,
        host: this.config.chainState.host,
        port: this.config.chainState.port,
      },
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
    const persistTransactionToChainStateUseCase = new PersistTransactionToChainStateUseCase(
      chainStateRepository
    );
    const resetChainStateUseCase = new ResetChainStateUseCase(chainStateRepository);
    const getVehicleOfTheChainByVin = new GetVehicleOfTheChainByVin(chainStateRepository);
    const getVehicleOfTheChainByLicensePlate = new GetVehicleOfTheChainByLicensePlate(
      chainStateRepository
    );
    const getVehiclesOfTheChain = new GetVehiclesOfTheChain(chainStateRepository);
    const getChainStatsUseCase = new GetChainStatsUseCase(chainRepository);
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
      getChainStatsUseCase,
      this.logger
    );
    this.chainStateService = new ChainStateService(
      persistTransactionToChainStateUseCase,
      resetChainStateUseCase,
      getBlocksUseCase,
      getVehicleOfTheChainByVin,
      getVehicleOfTheChainByLicensePlate,
      getVehiclesOfTheChain,
      this.chainService
    );
    const performHealthCheckUseCase = new PerformHealthCheckUseCase([
      new QueueHealthCheck(transactionQueue, 'transactionQueue'),
      new QueueHealthCheck(completedQueue, 'completedQueue'),
      new ChainRepositoryHealthCheck(chainRepository),
      new ChainStateRepositoryHealthCheck(chainStateRepository),
    ]);
    const healthcheckController = new HealthcheckController(performHealthCheckUseCase);
    const chainController = new ChainController(this.chainStateService, this.chainService);
    const api = new FastifyApiServer(this.config, healthcheckController, chainController);

    this.managedResources = [
      transactionQueue,
      completedQueue,
      chainRepository,
      chainStateRepository,
      api,
    ];
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

  override async stop(): Promise<void> {
    await super.stop();
    for (const job of this.jobs) {
      job.stop();
    }
  }
  override async initialize(): Promise<void> {
    await super.initialize();
    await this.chainService.initializeChain();

    const processTransactionJob = new CronJob('0 0 */1 * * *', async () => {
      this.logger.info('Begin transaction processing job');
      await this.chainService.processTransactionBatch(10);
      await this.chainStateService.refreshChainState();
      this.logger.info('End transaction processing job');
    });

    this.jobs.push(processTransactionJob);
    for (const job of this.jobs) {
      job.start();
    }
  }
}
