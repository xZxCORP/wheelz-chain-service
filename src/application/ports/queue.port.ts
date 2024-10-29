export interface QueuePort {
  dequeue(count: number): Promise<unknown[]>;
  enqueue(data: unknown): Promise<boolean>;
  isRunning(): Promise<boolean>;
}
