import type { CompanyWithUser } from '@zcorp/wheelz-contracts';
import { describe, expect, it } from 'vitest';

import { InMemoryUserService } from '../../../tests/fakes/in-memory-user.service.js';
import { GetCompanyByIdUseCase } from './get-company-by-id.use-case.js';

describe('GetCompanyByIdUseCase', () => {
  it('returns company when found', async () => {
    // Arrange
    const company: CompanyWithUser = {
      id: 1,
      name: 'Test Company',
      vatNumber: 'FR12345678901',
      isIdentified: true,
      headquartersAddress: '123 Test Street',
      country: 'France',
      ownerId: 1,
      companyType: 'other',
      companySize: 'small',
      companySector: 'private',
      createdAt: '2024-01-01T00:00:00Z',
      users: [
        {
          id: 1,
          createdAt: new Date('2024-01-01'),
          firstname: 'Test',
          lastname: 'User',
          email: 'test@example.com',
          roles: ['user'],
        },
      ],
    };
    const userService = new InMemoryUserService(new Map([[String(company.id), company]]));
    const sut = new GetCompanyByIdUseCase(userService);

    // Act
    const result = await sut.execute(String(company.id));

    // Assert
    expect(result).toEqual(company);
  });

  it('returns null when company not found', async () => {
    // Arrange
    const userService = new InMemoryUserService();
    const sut = new GetCompanyByIdUseCase(userService);

    // Act
    const result = await sut.execute('999');

    // Assert
    expect(result).toBeNull();
  });
});
