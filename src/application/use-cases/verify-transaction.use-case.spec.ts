import { describe, expect, it } from 'vitest';

import { FakeDataSigner } from '../../../tests/fakes/fake-data-signer.js';
import { sampleVehicleTransaction } from '../../domain/entities/sample-vehicle.transaction.js';
import { VerifyTransactionUseCase } from './verify-transaction.use-case.js';

describe('VerifyTransactionUseCase', () => {
  it('validates a correctly signed transaction', async () => {
    // Arrange
    const signer = new FakeDataSigner(true);
    const sut = new VerifyTransactionUseCase(signer);

    // Act
    const result = await sut.execute(sampleVehicleTransaction);

    // Assert
    expect(result).toBe(true);
  });

  it('rejects a transaction with invalid signature', async () => {
    // Arrange
    const signer = new FakeDataSigner(false); // Simulate invalid signature
    const sut = new VerifyTransactionUseCase(signer);

    // Act
    const result = await sut.execute(sampleVehicleTransaction);

    // Assert
    expect(result).toBe(false);
  });

  it('verifies transaction with all required fields in signature data', async () => {
    // Arrange
    const signer = new FakeDataSigner(true);
    const sut = new VerifyTransactionUseCase(signer);
    const transaction = {
      ...sampleVehicleTransaction,
      action: 'update' as const,
      data: { vin: 'NEW-VIN', changes: {} },
      withAnomaly: true,
      userId: 'different-user',
    };

    // Act
    const result = await sut.execute(transaction);

    // Assert
    expect(result).toBe(true);
  });

  it('handles transaction verification errors gracefully', async () => {
    // Arrange
    const signer = new FakeDataSigner(true);
    const sut = new VerifyTransactionUseCase(signer);
    const malformedTransaction = {
      ...sampleVehicleTransaction,
      data: undefined, // This will cause JSON.stringify to fail
    };

    // Act
    const result = await sut.execute(malformedTransaction as any);

    // Assert
    expect(result).toBe(false);
  });
});
