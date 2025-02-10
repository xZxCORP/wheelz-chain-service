import { initClient, type InitClientReturn } from '@ts-rest/core';
import { authenticationContract } from '@zcorp/wheelz-contracts';

export class BaseTsRestService {
  protected authClient: InitClientReturn<
    typeof authenticationContract,
    { baseUrl: ''; baseHeaders: {} }
  >;
  constructor(
    private readonly authServiceUrl: string,
    private readonly email: string,
    private readonly password: string
  ) {
    this.authClient = initClient(authenticationContract, {
      baseUrl: this.authServiceUrl,
    });
  }
  protected async getToken(): Promise<string | null> {
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
}
