export interface QueuePort {
  //   enqueue(data: unknown): Promise<boolean>
  isRunning(): Promise<boolean>;
}
