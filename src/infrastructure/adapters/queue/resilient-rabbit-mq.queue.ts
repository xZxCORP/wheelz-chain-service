import { Connection, type Publisher } from 'rabbitmq-client';

import type { LoggerPort } from '../../../application/ports/logger.port.js';
import type { QueuePort } from '../../../application/ports/queue.port.js';
import type { ManagedResource } from '../../managed.resource.js';

export class ResilientRabbitMQQueue implements QueuePort, ManagedResource {
  private connection: Connection;
  private publisher: Publisher | null = null;
  private isInitialized = false;

  constructor(
    private readonly url: string,
    private readonly queueName: string,
    private readonly logger: LoggerPort
  ) {
    this.connection = new Connection(this.url);

    this.connection.on('error', (error) => {
      this.logger.error('RabbitMQ connection error:', error);
    });

    this.connection.on('connection', () => {
      this.logger.info('Connection successfully (re)established');
    });
  }

  async isRunning(): Promise<boolean> {
    if (!this.isInitialized || !this.connection) {
      return false;
    }

    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Connection check timeout')), 2000);
      });

      const checkPromise = (async () => {
        const channel = await this.connection.acquire();
        await channel.close();
        return true;
      })();

      await Promise.race([checkPromise, timeoutPromise]);
      return true;
    } catch {
      return false;
    }
  }

  async initialize(): Promise<void> {
    try {
      this.logger.info('Initializing RabbitMQ connection...');

      this.publisher = this.connection.createPublisher({
        confirm: true,
        maxAttempts: 3,
      });

      this.isInitialized = true;
      this.logger.info('RabbitMQ initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize RabbitMQ:', error);
      throw error;
    }
  }

  async dispose(): Promise<void> {
    try {
      this.logger.info('Disposing RabbitMQ resources...');

      if (this.publisher) {
        await this.publisher.close();
        this.publisher = null;
      }

      await this.connection.close();
      this.isInitialized = false;

      this.logger.info('RabbitMQ disposed successfully');
    } catch (error) {
      this.logger.error('Error disposing RabbitMQ:', error);
      throw error;
    }
  }

  async enqueue(data: unknown): Promise<boolean> {
    if (!this.publisher || !this.isInitialized) {
      this.logger.error('Publisher not initialized');
      return false;
    }

    try {
      await this.publisher.send(this.queueName, data);
      return true;
    } catch (error) {
      this.logger.error('Failed to enqueue message:', error);
      return false;
    }
  }

  async dequeue(count: number): Promise<unknown[]> {
    if (!this.isInitialized) {
      this.logger.error('Connection not initialized');
      return [];
    }

    const messages: unknown[] = [];
    
    try {
      const channel = await this.connection.acquire();
      
      try {
        await channel.queueDeclare(this.queueName);

        for (let index = 0; index < count; index++) {
          const message = await channel.basicGet(this.queueName);
          
          if (!message) {
            break;
          }
          
          try {
            const content = message.body.toString();
            if (!content) {
              channel.basicNack({ 
                deliveryTag: message.deliveryTag, 
                requeue: false 
              });
              continue;
            }
            
            const data = JSON.parse(content);
            messages.push(data);
            
            channel.basicAck({ deliveryTag: message.deliveryTag });
          } catch (error) {
            channel.basicNack({ 
              deliveryTag: message.deliveryTag, 
              requeue: false 
            });
            this.logger.error('Error processing message:', error);
          }
        }
      } finally {
        await channel.close();
      }
      
      return messages;
    } catch (error) {
      this.logger.error('Error dequeuing messages:', error);
      throw error;
    }
  }

  async clear(): Promise<boolean> {
    if (!this.isInitialized) {
      this.logger.error('Connection not initialized');
      return false;
    }

    try {
      const channel = await this.connection.acquire();
      
      try {
        // Purger directement la queue (plus simple que delete/recreate)
        const result = await channel.queuePurge(this.queueName);
        this.logger.info(`Queue ${this.queueName} cleared, ${result.messageCount} messages removed`);
        return true;
      } finally {
        await channel.close();
      }
    } catch (error) {
      this.logger.error('Failed to clear queue:', error);
      return false;
    }
  }


}