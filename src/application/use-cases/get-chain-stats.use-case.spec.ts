import type { Block, ChainStats, VehicleTransaction } from '@zcorp/shared-typing-wheelz';
import { describe, expect, it } from 'vitest';

import { InMemoryChainRepository } from '../../../tests/fakes/in-memory-chain.repository.js';
import { sampleVehicleTransaction } from '../../domain/entities/sample-vehicle.transaction.js';
import { GetChainStatsUseCase } from './get-chain-stats.use-case.js';

function buildBlock(
  id: string,
  previousHash: string,
  timestamp: Date,
  txs: VehicleTransaction[]
): Block {
  return {
    id,
    previousHash,
    timestamp,
    transactions: txs,
    hash: `hash-${id}`,
  };
}

describe('GetChainStatsUseCase', () => {
  it('returns empty stats when there are no blocks', async () => {
    // Arrange
    const repo = new InMemoryChainRepository();
    const sut = new GetChainStatsUseCase(repo);

    // Act
    const stats = await sut.execute();

    // Assert
    expect(stats).toEqual<ChainStats>({
      evolutionOfTransactions: [],
      evolutionOfVehicles: [],
      lastExecution: null,
    });
  });

  it('computes cumulative totals and last execution correctly with one transaction', async () => {
    // Arrange
    const genesis = buildBlock('block-0', '0'.repeat(64), new Date('2024-01-01T00:00:00Z'), []);
    const block1 = buildBlock(
      'block-1',
      genesis.hash,
      new Date('2024-01-02T00:00:00Z'),
      [sampleVehicleTransaction] // 1 transaction create vehicle
    );
    const repo = new InMemoryChainRepository([genesis, block1]);
    const sut = new GetChainStatsUseCase(repo);

    // Act
    const stats = await sut.execute();

    // Assert
    expect(stats.evolutionOfTransactions).toEqual([
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-02', value: 1 },
    ]);
    expect(stats.evolutionOfVehicles).toEqual([
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-02', value: 1 },
    ]);
    expect(stats.lastExecution).toEqual({ date: '2024-01-02', newTransactions: 1 });
  });

  it('handles multiple transactions in a single block correctly', async () => {
    // Arrange
    const genesis = buildBlock('block-0', '0'.repeat(64), new Date('2024-01-01T00:00:00Z'), []);
    const createTx1 = { ...sampleVehicleTransaction, id: 'tx-1' };
    const createTx2 = { ...sampleVehicleTransaction, id: 'tx-2' };
    const block1 = buildBlock(
      'block-1',
      genesis.hash,
      new Date('2024-01-02T00:00:00Z'),
      [createTx1, createTx2] // 2 create transactions in same block
    );
    const repo = new InMemoryChainRepository([genesis, block1]);
    const sut = new GetChainStatsUseCase(repo);

    // Act
    const stats = await sut.execute();

    // Assert
    expect(stats.evolutionOfTransactions).toEqual([
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-02', value: 2 },
    ]);
    expect(stats.evolutionOfVehicles).toEqual([
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-02', value: 2 },
    ]);
    expect(stats.lastExecution).toEqual({ date: '2024-01-02', newTransactions: 2 });
  });

  it('handles create and delete transactions correctly', async () => {
    // Arrange
    const genesis = buildBlock('block-0', '0'.repeat(64), new Date('2024-01-01T00:00:00Z'), []);
    const createTx = { ...sampleVehicleTransaction, id: 'tx-1' };
    const deleteTx = {
      ...sampleVehicleTransaction,
      id: 'tx-2',
      action: 'delete' as const,
      data: { vin: sampleVehicleTransaction.data.vin },
    };
    const block1 = buildBlock(
      'block-1',
      genesis.hash,
      new Date('2024-01-02T00:00:00Z'),
      [createTx] // Create vehicle
    );
    const block2 = buildBlock(
      'block-2',
      block1.hash,
      new Date('2024-01-03T00:00:00Z'),
      [deleteTx] // Delete same vehicle
    );
    const repo = new InMemoryChainRepository([genesis, block1, block2]);
    const sut = new GetChainStatsUseCase(repo);

    // Act
    const stats = await sut.execute();

    // Assert
    expect(stats.evolutionOfTransactions).toEqual([
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-02', value: 1 },
      { date: '2024-01-03', value: 2 },
    ]);
    expect(stats.evolutionOfVehicles).toEqual([
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-02', value: 1 },
      { date: '2024-01-03', value: 0 }, // Vehicle count back to 0 after delete
    ]);
    expect(stats.lastExecution).toEqual({ date: '2024-01-03', newTransactions: 1 });
  });

  it('accumulates transactions on the same day', async () => {
    // Arrange
    const genesis = buildBlock('block-0', '0'.repeat(64), new Date('2024-01-01T00:00:00Z'), []);
    const morningBlock = buildBlock('block-1', genesis.hash, new Date('2024-01-02T10:00:00Z'), [
      { ...sampleVehicleTransaction, id: 'tx-1' },
    ]);
    const eveningBlock = buildBlock(
      'block-2',
      morningBlock.hash,
      new Date('2024-01-02T18:00:00Z'),
      [{ ...sampleVehicleTransaction, id: 'tx-2' }]
    );
    const repo = new InMemoryChainRepository([genesis, morningBlock, eveningBlock]);
    const sut = new GetChainStatsUseCase(repo);

    // Act
    const stats = await sut.execute();

    // Assert
    expect(stats.evolutionOfTransactions).toEqual([
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-02', value: 2 }, // Both transactions counted on same day
    ]);
    expect(stats.evolutionOfVehicles).toEqual([
      { date: '2024-01-01', value: 0 },
      { date: '2024-01-02', value: 2 },
    ]);
    expect(stats.lastExecution).toEqual({ date: '2024-01-02', newTransactions: 2 });
  });
});
