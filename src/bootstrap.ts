import type { AbstractApplication } from './presentation/applications/base.application.js';

export async function bootstrap(application: AbstractApplication) {
  process.on('SIGINT', async () => {
    application.logger.info('Received SIGINT. Graceful shutdown start');
    await application.stop();
  });

  process.on('SIGTERM', async () => {
    application.logger.info('Received SIGTERM. Graceful shutdown start');
    await application.stop();
  });

  await application.start();
}
