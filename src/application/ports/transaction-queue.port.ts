import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';

export interface TransactionQueuePort {
  dequeue(count: number): Promise<VehicleTransaction[]>;
  isRunning(): Promise<boolean>;
}
