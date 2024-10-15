import { AMQPChannel, AMQPClient, AMQPQueue } from '@cloudamqp/amqp-client';
import { AMQPBaseClient } from '@cloudamqp/amqp-client/amqp-base-client';
import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';
import {
  createTransactionFixture,
  deleteTransactionFixture,
  updateTransactionFixture,
} from '@zcorp/shared-typing-wheelz';

import type { LoggerPort } from '../../../application/ports/logger.port.js';
import type { TransactionQueuePort } from '../../../application/ports/transaction-queue.port.js';
import type { ManagedResource } from '../../managed.resource.js';
export class RabbitMQTransactionQueue implements TransactionQueuePort, ManagedResource {
  public client: AMQPClient;
  public connection: AMQPBaseClient | null = null;
  public channel: AMQPChannel | null = null;
  public queue: AMQPQueue | null = null;
  constructor(
    private readonly url: string,
    private readonly queueName: string,
    private readonly logger: LoggerPort
  ) {
    this.client = new AMQPClient(this.url);
  }
  dequeue(count: number): Promise<VehicleTransaction[]> {
    return Promise.resolve([
      createTransactionFixture,
      createTransactionFixture,
      createTransactionFixture,
      deleteTransactionFixture,
      updateTransactionFixture,
      createTransactionFixture,
      updateTransactionFixture,
      updateTransactionFixture,
      deleteTransactionFixture,
      createTransactionFixture,
    ]);
  }
  async isRunning(): Promise<boolean> {
    if (!this.connection || !this.channel || !this.queue) {
      return false;
    }
    if (this.connection.closed || this.channel.closed) {
      return false;
    }

    return true;
  }
  async initialize() {
    const connection = await this.client.connect();
    this.connection = connection;
    const channel = await this.client.channel();
    this.channel = channel;
    const queue = await channel.queue(this.queueName, { durable: true });
    this.queue = queue;
    this.logger.info('RabbitMQ initialized');
  }

  async dispose() {
    if (this.channel) {
      await this.channel.close();
    }
    if (this.connection) {
      await this.connection.close();
    }
    this.channel = null;
    this.connection = null;
    this.queue = null;
    this.logger.info('RabbitMQ disposed');
  }
}
