import { AMQPChannel, AMQPClient, AMQPQueue } from '@cloudamqp/amqp-client';
import { AMQPBaseClient } from '@cloudamqp/amqp-client/amqp-base-client';

import type { LoggerPort } from '../../../application/ports/logger.port.js';
import type { QueuePort } from '../../../application/ports/queue.port.js';
import type { ManagedResource } from '../../managed.resource.js';
export class RabbitMQQueue implements QueuePort, ManagedResource {
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
  async dequeue(count: number): Promise<unknown[]> {
    const messages: unknown[] = [];

    try {
      for (let index = 0; index < count; index++) {
        const message = await this.queue!.get({ noAck: false });
        if (!message) {
          break;
        }
        try {
          const content = message.bodyToString();
          if (!content) {
            await message.nack(false);
            continue;
          }
          const data = JSON.parse(content);
          messages.push(data);

          await message.ack();
        } catch (error) {
          await message.nack(false);
          this.logger.error('Error processing message:', error);
        }
      }
      return messages;
    } catch (error) {
      this.logger.error('Error dequeuing messages:', error);
      throw error;
    }
  }
  async enqueue(data: unknown): Promise<boolean> {
    const isRunning = await this.isRunning();
    if (!isRunning) {
      return false;
    }
    try {
      await this.queue!.publish(Buffer.from(JSON.stringify(data)), { deliveryMode: 2 });
      return true;
    } catch {
      throw new Error('Error while enqueuing data');
    }
  }
  async isRunning(): Promise<boolean> {
    return true;
  }
  async initialize() {
    const connection = await this.client.connect();
    this.connection = connection;
    const channel = await this.client.channel();
    this.channel = channel;

    const queue = await channel.queue(this.queueName, { durable: true });
    this.queue = queue;
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
