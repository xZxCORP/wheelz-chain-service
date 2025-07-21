import { vehicleFixture, type VehicleTransaction } from '@zcorp/shared-typing-wheelz';
import { describe, expect, it } from 'vitest';

import type { BlockData } from '../entities/block-data.entity.js';
import { sampleVehicleTransaction } from '../entities/sample-vehicle.transaction.js';
import { BlockDataPreparationService } from './block-data-preparation.service.js';

describe('BlockDataPreparationService', () => {
  it('serialises block data deterministically into a JSON string', async () => {
    // Arrange
    const sut = new BlockDataPreparationService();

    const fakeTransactions: VehicleTransaction[] = [sampleVehicleTransaction];
    const blockData: BlockData = {
      previousHash: 'prev-hash',
      timestamp: new Date('2024-01-01T00:00:00Z'),
      transactions: fakeTransactions,
    };

    // Act
    const resultOne = sut.prepareForHashing(blockData);
    const resultTwo = sut.prepareForHashing(blockData);

    // Assert
    expect(resultOne).toBe(resultTwo);
    const parsed = JSON.parse(resultOne);
    expect(parsed.previousHash).toBe('prev-hash');
    expect(parsed.timestamp).toBe(new Date('2024-01-01T00:00:00Z').toISOString());
    expect(parsed.transactions).toHaveLength(1);
    expect(parsed.transactions[0]).toMatchObject({
      id: 'tx-123',
      action: 'create',
      userId: 'user-1',
      status: 'pending',
      withAnomaly: false,
      data: vehicleFixture,
      dataSignature: { signature: '', signAlgorithm: 'sha256' },
    });
  });
});
