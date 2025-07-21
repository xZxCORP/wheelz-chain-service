import type { Block, ChainStats } from '@zcorp/shared-typing-wheelz';
import { describe, expect, it } from 'vitest';

import { InMemoryChainRepository } from '../../../tests/fakes/in-memory-chain.repository.js';
import { sampleVehicleTransaction } from '../../domain/entities/sample-vehicle.transaction.js';
import { GetChainStatsUseCase } from './get-chain-stats.use-case.js';

function buildBlock(id: string, previousHash: string, timestamp: Date, txs: any[]): Block {
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

  it('computes cumulative totals and last execution correctly', async () => {
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
});
