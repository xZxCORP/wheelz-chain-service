import { describe, expect, it } from 'vitest';

import { FakeDateProvider } from '../../../tests/fakes/fake-date-provider.js';
import { FakeHasher } from '../../../tests/fakes/fake-hasher.js';
import { FakeIdGenerator } from '../../../tests/fakes/fake-id-generator.js';
import { InMemoryChainRepository } from '../../../tests/fakes/in-memory-chain.repository.js';
import { sampleVehicleTransaction } from '../../domain/entities/sample-vehicle.transaction.js';
import { BlockDataPreparationService } from '../../domain/service/block-data-preparation.service.js';
import { CreateBlockUseCase } from './create-block.use-case.js';

describe('CreateBlockUseCase', () => {
  it('creates a block with correct properties and links to previous block', async () => {
    // Arrange
    const fixedDate = new Date('2024-01-01T00:00:00Z');
    const previousBlock = {
      id: 'previous-block',
      previousHash: '0'.repeat(64),
      timestamp: new Date('2023-12-31T00:00:00Z'),
      transactions: [],
      hash: 'previous-block-hash',
    };
    const repo = new InMemoryChainRepository([previousBlock]);
    const sut = new CreateBlockUseCase(
      repo,
      new FakeDateProvider(fixedDate),
      new FakeHasher(),
      new FakeIdGenerator(),
      new BlockDataPreparationService()
    );

    // Act
    const block = await sut.execute([sampleVehicleTransaction]);

    // Assert
    expect(block).toMatchObject({
      id: 'test-id-1',
      previousHash: 'previous-block-hash',
      timestamp: fixedDate,
      transactions: [sampleVehicleTransaction],
      hash: expect.stringMatching(/^hash:/), // FakeHasher format
    });
  });

  it('throws error when chain is not initialized (no previous block)', async () => {
    // Arrange
    const repo = new InMemoryChainRepository();
    const sut = new CreateBlockUseCase(
      repo,
      new FakeDateProvider(),
      new FakeHasher(),
      new FakeIdGenerator(),
      new BlockDataPreparationService()
    );

    // Act & Assert
    await expect(sut.execute([sampleVehicleTransaction])).rejects.toThrow(
      'Chain is not initialized'
    );
  });

  it('persists the created block to the repository', async () => {
    // Arrange
    const previousBlock = {
      id: 'previous-block',
      previousHash: '0'.repeat(64),
      timestamp: new Date('2023-12-31T00:00:00Z'),
      transactions: [],
      hash: 'previous-block-hash',
    };
    const repo = new InMemoryChainRepository([previousBlock]);
    const sut = new CreateBlockUseCase(
      repo,
      new FakeDateProvider(),
      new FakeHasher(),
      new FakeIdGenerator(),
      new BlockDataPreparationService()
    );

    // Act
    const block = await sut.execute([sampleVehicleTransaction]);

    // Assert
    const storedBlocks = await repo.getBlocks();
    expect(storedBlocks).toHaveLength(2); // Previous + new block
    expect(storedBlocks[1]).toBe(block);
  });

  it('creates block with multiple transactions correctly', async () => {
    // Arrange
    const previousBlock = {
      id: 'previous-block',
      previousHash: '0'.repeat(64),
      timestamp: new Date('2023-12-31T00:00:00Z'),
      transactions: [],
      hash: 'previous-block-hash',
    };
    const repo = new InMemoryChainRepository([previousBlock]);
    const sut = new CreateBlockUseCase(
      repo,
      new FakeDateProvider(),
      new FakeHasher(),
      new FakeIdGenerator(),
      new BlockDataPreparationService()
    );

    const transactions = [
      { ...sampleVehicleTransaction, id: 'tx-1' },
      { ...sampleVehicleTransaction, id: 'tx-2' },
      { ...sampleVehicleTransaction, id: 'tx-3' },
    ];

    // Act
    const block = await sut.execute(transactions);

    // Assert
    expect(block.transactions).toHaveLength(3);
    expect(block.transactions.map((tx) => tx.id)).toEqual(['tx-1', 'tx-2', 'tx-3']);
  });

  it('uses BlockDataPreparationService to prepare hash input', async () => {
    // Arrange
    const fixedDate = new Date('2024-01-01T00:00:00Z');
    const previousBlock = {
      id: 'previous-block',
      previousHash: '0'.repeat(64),
      timestamp: new Date('2023-12-31T00:00:00Z'),
      transactions: [],
      hash: 'previous-block-hash',
    };
    const repo = new InMemoryChainRepository([previousBlock]);
    const blockPrep = new BlockDataPreparationService();
    const hasher = new FakeHasher();
    const sut = new CreateBlockUseCase(
      repo,
      new FakeDateProvider(fixedDate),
      hasher,
      new FakeIdGenerator(),
      blockPrep
    );

    // Act
    const block = await sut.execute([sampleVehicleTransaction]);

    // Assert
    const expectedHashInput = blockPrep.prepareForHashing({
      previousHash: previousBlock.hash,
      timestamp: fixedDate,
      transactions: [sampleVehicleTransaction],
    });
    expect(block.hash).toBe(`hash:${expectedHashInput}`);
  });
});
