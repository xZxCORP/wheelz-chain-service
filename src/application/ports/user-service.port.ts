import type { CompanyWithUser } from '@zcorp/wheelz-contracts';

export interface UserServicePort {
  getCompanyById(id: string): Promise<CompanyWithUser | null>;
}
