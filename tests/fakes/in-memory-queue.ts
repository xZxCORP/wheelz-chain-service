import type { QueuePort } from '../../src/application/ports/queue.port.js';

export class InMemoryQueue implements QueuePort {
  private messages: unknown[] = [];
  constructor(private shouldSucceed: boolean = true) {}

  async dequeue(count: number): Promise<unknown[]> {
    if (!this.shouldSucceed) return [];
    return this.messages.splice(0, count);
  }

  async enqueue(data: unknown): Promise<boolean> {
    if (!this.shouldSucceed) return false;
    this.messages.push(data);
    return true;
  }

  async isRunning(): Promise<boolean> {
    return this.shouldSucceed;
  }

  // Helper method for tests
  getMessages(): unknown[] {
    return [...this.messages];
  }
}
