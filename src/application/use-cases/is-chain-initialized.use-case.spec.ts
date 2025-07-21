import { describe, expect, it } from 'vitest';

import { InMemoryChainRepository } from '../../../tests/fakes/in-memory-chain.repository.js';
import { IsChainInitializedUseCase } from './is-chain-initialized.use-case.js';

describe('IsChainInitializedUseCase', () => {
  it('returns true when a block exists', async () => {
    // Arrange
    const block = {
      id: 'block-1',
      previousHash: '0'.repeat(64),
      timestamp: new Date(),
      transactions: [],
      hash: 'hash-1',
    };
    const repo = new InMemoryChainRepository([block]);
    const sut = new IsChainInitializedUseCase(repo);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toBe(true);
  });

  it('returns false when no block exists', async () => {
    // Arrange
    const repo = new InMemoryChainRepository();
    const sut = new IsChainInitializedUseCase(repo);

    // Act
    const result = await sut.execute();

    // Assert
    expect(result).toBe(false);
  });
});
