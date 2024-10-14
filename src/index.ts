import { Application } from './application.js';

async function bootstrap() {
  const application = await Application.create();
  process.on('SIGINT', async () => {
    console.log('Received SIGINT. Graceful shutdown start');
    await application.stop();
  });

  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM. Graceful shutdown start');
    await application.stop();
  });

  await application.start();
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
