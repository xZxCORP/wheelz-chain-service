import { Command } from 'commander';

import { bootstrap } from './bootstrap.js';
import { CliApplication } from './presentation/applications/cli.application.js';

async function main() {
  const program = new Command();

  program
    .version('1.0.0')
    .description('Chain CLI')
    .hook('preAction', async (thisCommand) => {
      try {
        const app = await CliApplication.create();
        thisCommand.setOptionValue('app', app);
      } catch (error) {
        console.error('Error initializing application', error);
        process.exit(1);
      }
    });

  program
    .command('verify-chain')
    .description('Verify chain integrity(blocks, transactions)')
    .action(async (_options, command) => {
      const app: CliApplication = command.parent.getOptionValue('app');

      try {
        await bootstrap(app);
        app.logger.info('Verifying chain');
        const result = await app.verifyChain();
        if (result) {
          app.logger.info('Chain is valid');
        } else {
          app.logger.error('Chain is invalid');
        }
        await app.stop();
      } catch {
        app.logger.error('Error verifying chain');
        await app.stop();
        process.exit(1);
      }
    });
  program
    .command('reset-chain')
    .description('Reset chain')
    .action(async (_options, command) => {
      const app: CliApplication = command.parent.getOptionValue('app');

      try {
        await bootstrap(app);
        app.logger.info('Resetting chain');
        await app.resetChain();
        app.logger.info('Chain reset');
        await app.stop();
      } catch {
        app.logger.error('Error resetting chain');
        await app.stop();
        process.exit(1);
      }
    });
  program
    .command('process-transactions')
    .description('Process transactions from the queue')
    .requiredOption('-s, --size <number>', 'The batch size')

    .action(async (options, command) => {
      const app: CliApplication = command.parent.getOptionValue('app');
      const size = Number.parseInt(options.size);
      if (Number.isNaN(size)) {
        app.logger.error('Invalid batch size');
        process.exit(1);
      }

      try {
        await bootstrap(app);
        app.logger.info('Processing transactions');
        await app.processTransactions(size);
        app.logger.info('Transactions processed');
        await app.stop();
      } catch (error) {
        app.logger.error('Error processing transactions', error);
        await app.stop();
        process.exit(1);
      }
    });
  await program.parseAsync(process.argv);
}
main();
