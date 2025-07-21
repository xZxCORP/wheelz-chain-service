import type { Block } from '@zcorp/shared-typing-wheelz';
import { describe, expect, it } from 'vitest';

import { FakeHasher } from '../../../tests/fakes/fake-hasher.js';
import { BlockDataPreparationService } from '../../domain/service/block-data-preparation.service.js';
import { VerifyBlockPairUseCase } from './verify-block-pair.use-case.js';

function buildBlock(
  id: string,
  previousHash: string,
  timestamp: Date,
  transactions: any[] = []
): Block {
  const prep = new BlockDataPreparationService();
  const dataToHash = prep.prepareForHashing({ previousHash, timestamp, transactions });
  const hash = `hash:${dataToHash}`; // Matches FakeHasher output format

  return {
    id,
    previousHash,
    timestamp,
    transactions,
    hash,
  };
}

describe('VerifyBlockPairUseCase', () => {
  it('validates a correctly chained block pair', async () => {
    // Arrange
    const blockPrep = new BlockDataPreparationService();
    const hasher = new FakeHasher();
    const sut = new VerifyBlockPairUseCase(blockPrep, hasher);

    const previousBlock = buildBlock('block-1', '0'.repeat(64), new Date('2024-01-01T00:00:00Z'));
    const currentBlock = buildBlock(
      'block-2',
      previousBlock.hash,
      new Date('2024-01-02T00:00:00Z')
    );

    // Act
    const result = await sut.execute(currentBlock, previousBlock);

    // Assert
    expect(result).toBe(true);
  });

  it('rejects blocks with mismatched previous hash', async () => {
    // Arrange
    const blockPrep = new BlockDataPreparationService();
    const hasher = new FakeHasher();
    const sut = new VerifyBlockPairUseCase(blockPrep, hasher);

    const previousBlock = buildBlock('block-1', '0'.repeat(64), new Date('2024-01-01T00:00:00Z'));
    const currentBlock = buildBlock(
      'block-2',
      'wrong-previous-hash', // Incorrect previousHash
      new Date('2024-01-02T00:00:00Z')
    );

    // Act
    const result = await sut.execute(currentBlock, previousBlock);

    // Assert
    expect(result).toBe(false);
  });

  it('rejects blocks with invalid hash', async () => {
    // Arrange
    const blockPrep = new BlockDataPreparationService();
    const hasher = new FakeHasher();
    const sut = new VerifyBlockPairUseCase(blockPrep, hasher);

    const previousBlock = buildBlock('block-1', '0'.repeat(64), new Date('2024-01-01T00:00:00Z'));

    const invalidBlock: Block = {
      ...buildBlock('block-2', previousBlock.hash, new Date('2024-01-02T00:00:00Z')),
      hash: 'tampered-hash', // Hash doesn't match block content
    };

    // Act
    const result = await sut.execute(invalidBlock, previousBlock);

    // Assert
    expect(result).toBe(false);
  });

  it('validates blocks with transactions correctly', async () => {
    // Arrange
    const blockPrep = new BlockDataPreparationService();
    const hasher = new FakeHasher();
    const sut = new VerifyBlockPairUseCase(blockPrep, hasher);

    const previousBlock = buildBlock('block-1', '0'.repeat(64), new Date('2024-01-01T00:00:00Z'));

    const transactions = [
      { id: 'tx1', data: 'some data' },
      { id: 'tx2', data: 'more data' },
    ];

    const currentBlock = buildBlock(
      'block-2',
      previousBlock.hash,
      new Date('2024-01-02T00:00:00Z'),
      transactions
    );

    // Act
    const result = await sut.execute(currentBlock, previousBlock);

    // Assert
    expect(result).toBe(true);
  });
});
