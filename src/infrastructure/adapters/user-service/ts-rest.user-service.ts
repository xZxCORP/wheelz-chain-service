import { initClient, type InitClientReturn } from '@ts-rest/core';
import { companyContract, type CompanyWithUser } from '@zcorp/wheelz-contracts';

import type { UserServicePort } from '../../../application/ports/user-service.port.js';
import { BaseTsRestService } from '../shared/base.ts-rest.js';

export class TsRestUserService extends BaseTsRestService implements UserServicePort {
  private companyClient: InitClientReturn<typeof companyContract, { baseUrl: ''; baseHeaders: {} }>;

  constructor(
    private readonly userServiceUrl: string,
    authServiceUrl: string,
    email: string,
    password: string
  ) {
    super(authServiceUrl, email, password);
    this.companyClient = initClient(companyContract, {
      baseUrl: this.userServiceUrl,
    });
  }
  async getCompanyById(id: string): Promise<CompanyWithUser | null> {
    const token = await this.getToken();
    if (!token) {
      return null;
    }
    const company = await this.companyClient.contract.show({
      params: {
        id,
      },
      extraHeaders: {
        authorization: `Bearer ${token}`,
      },
    });
    if (company.status === 200) {
      return company.body.data;
    }
    return null;
  }
}
