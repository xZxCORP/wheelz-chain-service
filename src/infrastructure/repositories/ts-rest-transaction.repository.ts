import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';

import type { TransactionRepository } from '../../domain/repositories/transaction.repository.js';

export class TsRestTransactionRepository implements TransactionRepository {
  getById(transactionId: string): Promise<VehicleTransaction | null> {}
}
