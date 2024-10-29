import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';

import type { DataSignerPort } from '../ports/data-signer.port.js';

export class VerifyTransactionUseCase {
  constructor(private readonly dataSigner: DataSignerPort) {}
  execute(transaction: VehicleTransaction) {
    return this.dataSigner.verify(
      JSON.stringify({
        action: transaction.action,
        data: transaction.data,
      }),
      transaction.dataSignature
    );
  }
}
