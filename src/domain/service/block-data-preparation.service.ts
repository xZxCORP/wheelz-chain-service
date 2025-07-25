import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';

import type { BlockData } from '../entities/block-data.entity.js';

export class BlockDataPreparationService {
  prepareForHashing(blockData: BlockData): string {
    return JSON.stringify({
      previousHash: blockData.previousHash,
      timestamp: blockData.timestamp.toISOString(),
      transactions: blockData.transactions.map((element) => this.serializeTransaction(element)),
    });
  }

  private serializeTransaction(transaction: VehicleTransaction): object {
    return {
      id: transaction.id,
      timestamp: transaction.timestamp,
      dataSignature: transaction.dataSignature,
      action: transaction.action,
      data: transaction.data,
      withAnomaly: transaction.withAnomaly,
      userId: transaction.userId,
      status: transaction.status,
    };
  }
}
