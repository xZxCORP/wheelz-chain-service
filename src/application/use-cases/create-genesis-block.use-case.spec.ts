import { describe, expect, it } from 'vitest';

import { FakeDateProvider } from '../../../tests/fakes/fake-date-provider.js';
import { FakeHasher } from '../../../tests/fakes/fake-hasher.js';
import { FakeIdGenerator } from '../../../tests/fakes/fake-id-generator.js';
import { InMemoryChainRepository } from '../../../tests/fakes/in-memory-chain.repository.js';
import { CreateGenesisBlockUseCase } from './create-genesis-block.use-case.js';

describe('CreateGenesisBlockUseCase', () => {
  it('creates a genesis block with expected properties when chain is empty', async () => {
    // Arrange
    const repo = new InMemoryChainRepository();
    const fixedDate = new Date('2024-01-01T00:00:00Z');
    const sut = new CreateGenesisBlockUseCase(
      repo,
      new FakeHasher(),
      new FakeDateProvider(fixedDate),
      new FakeIdGenerator()
    );

    // Act
    const block = await sut.execute();

    // Assert
    expect(block).toMatchObject({
      id: 'test-id-1',
      previousHash: '0'.repeat(64),
      timestamp: fixedDate,
      transactions: [],
      hash: expect.stringContaining('hash:Genesis Block - Created at 2024-01-01T00:00:00.000Z'),
    });
  });

  it('throws error when a block already exists', async () => {
    // Arrange
    const existingBlock = {
      id: 'existing-block',
      previousHash: '0'.repeat(64),
      timestamp: new Date(),
      transactions: [],
      hash: 'some-hash',
    };
    const repo = new InMemoryChainRepository([existingBlock]);
    const sut = new CreateGenesisBlockUseCase(
      repo,
      new FakeHasher(),
      new FakeDateProvider(),
      new FakeIdGenerator()
    );

    // Act & Assert
    await expect(sut.execute()).rejects.toThrow('Genesis block already exists');
  });

  it('persists the created block to the repository', async () => {
    // Arrange
    const repo = new InMemoryChainRepository();
    const sut = new CreateGenesisBlockUseCase(
      repo,
      new FakeHasher(),
      new FakeDateProvider(),
      new FakeIdGenerator()
    );

    // Act
    const block = await sut.execute();

    // Assert
    const storedBlocks = await repo.getBlocks();
    expect(storedBlocks).toHaveLength(1);
    expect(storedBlocks[0]).toBe(block);
  });
});
