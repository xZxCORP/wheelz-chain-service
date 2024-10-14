import { configDotenv } from 'dotenv';

import {
  type Config,
  type ConfigLoaderPort,
  configSchema,
} from '../../ports/config-loader.port.js';

export class EnvironmentConfigLoader implements ConfigLoaderPort {
  constructor() {
    configDotenv();
  }
  async load(): Promise<Config> {
    const data = {
      logLevel: process.env.LOG_LEVEL,
      transactionQueue: {
        url: process.env.NOTIFICATION_QUEUE_URL,
        queueName: process.env.NOTIFICATION_QUEUE_NAME,
      },
      api: {
        host: process.env.API_HOST,
        port: process.env.API_PORT,
      },
      dataSigner: {
        signAlgorithm: process.env.DATA_SIGNER_ALGORITHM,
        publicKey: process.env.DATA_SIGNER_PUBLIC,
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
