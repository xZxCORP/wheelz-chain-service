import { describe, expect, it } from 'vitest';

import { InMemoryChainRepository } from '../../../tests/fakes/in-memory-chain.repository.js';
import { DeleteBlocksUseCase } from './delete-blocks.use-case.js';

describe('DeleteBlocksUseCase', () => {
  it('deletes all blocks from the repository', async () => {
    // Arrange
    const blocks = [
      {
        id: 'block-1',
        previousHash: '0'.repeat(64),
        timestamp: new Date(),
        transactions: [],
        hash: 'hash-1',
      },
      {
        id: 'block-2',
        previousHash: 'hash-1',
        timestamp: new Date(),
        transactions: [],
        hash: 'hash-2',
      },
    ];
    const repo = new InMemoryChainRepository(blocks);
    const sut = new DeleteBlocksUseCase(repo);

    // Act
    await sut.execute();

    // Assert
    const remainingBlocks = await repo.getBlocks();
    expect(remainingBlocks).toHaveLength(0);
  });

  it('succeeds even when repository is empty', async () => {
    // Arrange
    const repo = new InMemoryChainRepository();
    const sut = new DeleteBlocksUseCase(repo);

    // Act & Assert
    await expect(sut.execute()).resolves.not.toThrow();
  });
});
