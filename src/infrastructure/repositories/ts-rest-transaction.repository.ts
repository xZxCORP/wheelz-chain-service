import { initClient, type InitClientReturn } from '@ts-rest/core';
import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';
import { authenticationContract, transactionContract } from '@zcorp/wheelz-contracts';

import type { TransactionRepository } from '../../domain/repositories/transaction.repository.js';

export class TsRestTransactionRepository implements TransactionRepository {
  private transactionClient: InitClientReturn<
    typeof transactionContract,
    { baseUrl: ''; baseHeaders: {} }
  >;
  private authClient: InitClientReturn<
    typeof authenticationContract,
    { baseUrl: ''; baseHeaders: {} }
  >;
  private cachedToken: string | null = null;
  constructor(
    private readonly transactionServiceUrl: string,
    private readonly authServiceUrl: string,
    private readonly email: string,
    private readonly password: string
  ) {
    this.transactionClient = initClient(transactionContract, {
      baseUrl: this.transactionServiceUrl,
    });
    this.authClient = initClient(authenticationContract, {
      baseUrl: this.authServiceUrl,
    });
  }
  private async fetchAndStoreNewToken(): Promise<string | null> {
    const loginResponse = await this.authClient.authentication.login({
      body: {
        email: this.email,
        password: this.password,
      },
    });
    if (loginResponse.status === 201) {
      return loginResponse.body.token;
    }
    return null;
  }
  private async getToken(): Promise<string | null> {
    if (this.cachedToken) {
      return this.cachedToken;
    }
    const token = await this.fetchAndStoreNewToken();
    if (token) {
      this.cachedToken = token;
    }
    return token;
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
      this.cachedToken = null;
      //TODO: retry
    }
    return null;
  }
}
