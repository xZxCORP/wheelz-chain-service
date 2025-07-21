import type { Block } from '@zcorp/shared-typing-wheelz';
import { describe, expect, it } from 'vitest';

import { InMemoryChainRepository } from '../../../tests/fakes/in-memory-chain.repository.js';
import { sampleVehicleTransaction } from '../../domain/entities/sample-vehicle.transaction.js';
import { GetBlocksUseCase } from './get-blocks.use-case.js';

describe('GetBlocksUseCase', () => {
  it('returns all blocks stored in the repository, ordered as inserted', async () => {
    // Arrange
    const genesis: Block = {
      id: 'block-0',
      previousHash: '0'.repeat(64),
      timestamp: new Date('2024-01-01T00:00:00Z'),
      transactions: [],
      hash: 'hash-0',
    };
    const block1: Block = {
      id: 'block-1',
      previousHash: genesis.hash,
      timestamp: new Date('2024-01-02T00:00:00Z'),
      transactions: [sampleVehicleTransaction],
      hash: 'hash-1',
    };
    const repo = new InMemoryChainRepository([genesis, block1]);
    const sut = new GetBlocksUseCase(repo);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([genesis, block1]);
  });

  it('returns an empty array when no block exists', async () => {
    // Arrange
    const repo = new InMemoryChainRepository();
    const sut = new GetBlocksUseCase(repo);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toEqual([]);
  });
});
