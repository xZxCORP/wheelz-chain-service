import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';

export interface TransactionRepository {
  getById(transactionId: string): Promise<VehicleTransaction | null>;
}
