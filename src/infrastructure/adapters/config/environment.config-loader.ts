import { configDotenv } from 'dotenv';

import {
  type Config,
  type ConfigLoaderPort,
  configSchema,
} from '../../ports/config-loader.port.js';

export class EnvironmentConfigLoader implements ConfigLoaderPort {
  constructor(path: string = '.env') {
    configDotenv({
      path,
    });
  }
  async load(): Promise<Config> {
    const data = {
      logLevel: process.env.LOG_LEVEL,
      transactionQueue: {
        url: process.env.TRANSACTION_QUEUE_URL,
        newQueueName: process.env.TRANSACTION_QUEUE_NEW_NAME,
        completedQueueName: process.env.TRANSACTION_QUEUE_COMPLETED_NAME,
      },
      api: {
        host: process.env.API_HOST,
        port: process.env.API_PORT,
      },
      dataSigner: {
        signAlgorithm: process.env.DATA_SIGNER_ALGORITHM,
        publicKey: process.env.DATA_SIGNER_PUBLIC,
      },
      chain: {
        uri: process.env.CHAIN_URI,
        databaseName: process.env.CHAIN_DATABASE_NAME,
        collectionName: process.env.CHAIN_COLLECTION_NAME,
      },
    };
    const config = await configSchema.safeParseAsync(data);
    if (!config.success) {
      throw new Error(config.error.name, {
        cause: config.error.flatten().fieldErrors,
      });
    }
    return config.data;
  }
}
