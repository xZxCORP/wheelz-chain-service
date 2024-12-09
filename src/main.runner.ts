import { bootstrap } from './bootstrap.js';
import { MainApplication } from './presentation/applications/main.application.js';

const app = await MainApplication.create();
bootstrap(app).catch((error) => {
  console.error(error);
  process.exit(1);
});
