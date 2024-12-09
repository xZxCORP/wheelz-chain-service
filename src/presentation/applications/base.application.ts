import type { LoggerPort } from '../../application/ports/logger.port.js';
import type { ManagedResource } from '../../infrastructure/managed.resource.js';
import type { Config } from '../../infrastructure/ports/config-loader.port.js';

export abstract class AbstractApplication {
  protected managedResources: ManagedResource[] = [];

  constructor(
    public readonly config: Config,
    public readonly logger: LoggerPort
  ) {}

  abstract initializeResources(): Promise<void>;

  async initialize(): Promise<void> {
    this.logger.info('Initializing application');
    await this.initializeResources();
    for (const resource of this.managedResources) {
      await resource.initialize();
    }
  }

  async start(): Promise<void> {
    this.logger.info('Starting application');
    await this.initialize();
  }

  async stop(): Promise<void> {
    this.logger.info('Stopping application');
    for (const resource of this.managedResources) {
      await resource.dispose();
    }
  }
}
