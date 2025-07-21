import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';

import type { TransactionRepository } from '../../src/domain/repositories/transaction.repository.js';

export class InMemoryTransactionRepository implements TransactionRepository {
  constructor(private transactions: Map<string, VehicleTransaction> = new Map()) {}

  async getById(transactionId: string): Promise<VehicleTransaction | null> {
    return this.transactions.get(transactionId) ?? null;
  }
}
