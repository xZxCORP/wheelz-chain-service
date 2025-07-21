import type { CompanyWithUser } from '@zcorp/wheelz-contracts';

import type { UserServicePort } from '../../src/application/ports/user-service.port.js';

export class InMemoryUserService implements UserServicePort {
  constructor(private companies: Map<string, CompanyWithUser> = new Map()) {}

  async getCompanyById(id: string): Promise<CompanyWithUser | null> {
    return this.companies.get(id) ?? null;
  }
}
