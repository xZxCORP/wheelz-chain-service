import { initClient, type InitClientReturn } from '@ts-rest/core';
import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';
import { transactionContract } from '@zcorp/wheelz-contracts';

import type { TransactionRepository } from '../../domain/repositories/transaction.repository.js';
import { BaseTsRestService } from '../adapters/shared/base.ts-rest.js';

export class TsRestTransactionRepository
  extends BaseTsRestService
  implements TransactionRepository
{
  private transactionClient: InitClientReturn<
    typeof transactionContract,
    { baseUrl: ''; baseHeaders: {} }
  >;

  constructor(
    private readonly transactionServiceUrl: string,
    authServiceUrl: string,
    email: string,
    password: string
  ) {
    super(authServiceUrl, email, password);
    this.transactionClient = initClient(transactionContract, {
      baseUrl: this.transactionServiceUrl,
    });
  }

  async getById(transactionId: string): Promise<VehicleTransaction | null> {
    const token = await this.getToken();
    if (!token) {
      return null;
    }
    const transaction = await this.transactionClient.transactions.getTransactionById({
      params: {
        id: transactionId,
      },
      extraHeaders: {
        authorization: `Bearer ${token}`,
      },
    });
    if (transaction.status === 200) {
      return transaction.body;
    }
    if (transaction.status === 401) {
      return null;
    }
    return null;
  }
}
