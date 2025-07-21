import type { QueueTransaction } from '@zcorp/shared-typing-wheelz';
import { describe, expect, it } from 'vitest';

import { InMemoryQueue } from '../../../tests/fakes/in-memory-queue.js';
import { InMemoryTransactionRepository } from '../../../tests/fakes/in-memory-transaction.repository.js';
import { sampleVehicleTransaction } from '../../domain/entities/sample-vehicle.transaction.js';
import { DequeueTransactionsUseCase } from './dequeue-transactions.use-case.js';

describe('DequeueTransactionsUseCase', () => {
  it('dequeues and maps valid transactions correctly', async () => {
    // Arrange
    const queueMessages: QueueTransaction[] = [
      { transactionId: 'tx-1' },
      { transactionId: 'tx-2' },
    ];
    const queue = new InMemoryQueue();
    await queue.enqueue(queueMessages[0]);
    await queue.enqueue(queueMessages[1]);

    const transactions = [
      { ...sampleVehicleTransaction, id: 'tx-1' },
      { ...sampleVehicleTransaction, id: 'tx-2' },
    ];
    const transactionRepo = new InMemoryTransactionRepository(
      new Map(transactions.map((tx) => [tx.id, tx]))
    );

    const sut = new DequeueTransactionsUseCase(queue, transactionRepo);

    // Act
    const result = await sut.execute(2);

    // Assert
    expect(result).toHaveLength(2);
    expect(result).toEqual(transactions);
  });

  it('filters out transactions that do not exist in repository', async () => {
    // Arrange
    const queueMessages: QueueTransaction[] = [
      { transactionId: 'tx-1' },
      { transactionId: 'tx-nonexistent' },
    ];
    const queue = new InMemoryQueue();
    await queue.enqueue(queueMessages[0]);
    await queue.enqueue(queueMessages[1]);

    const transaction = { ...sampleVehicleTransaction, id: 'tx-1' };
    const transactionRepo = new InMemoryTransactionRepository(new Map([['tx-1', transaction]]));

    const sut = new DequeueTransactionsUseCase(queue, transactionRepo);

    // Act
    const result = await sut.execute(2);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(transaction);
  });

  it('returns empty array when queue is empty', async () => {
    // Arrange
    const queue = new InMemoryQueue();
    const transactionRepo = new InMemoryTransactionRepository();
    const sut = new DequeueTransactionsUseCase(queue, transactionRepo);

    // Act
    const result = await sut.execute(5);

    // Assert
    expect(result).toEqual([]);
  });

  it('returns empty array when queue data is invalid', async () => {
    // Arrange
    const queue = new InMemoryQueue();
    await queue.enqueue({ invalidData: true }); // Invalid queue message format

    const transactionRepo = new InMemoryTransactionRepository();
    const sut = new DequeueTransactionsUseCase(queue, transactionRepo);

    // Act
    const result = await sut.execute(1);

    // Assert
    expect(result).toEqual([]);
  });

  it('respects the batch size parameter', async () => {
    // Arrange
    const queueMessages: QueueTransaction[] = [
      { transactionId: 'tx-1' },
      { transactionId: 'tx-2' },
      { transactionId: 'tx-3' },
    ];
    const queue = new InMemoryQueue();
    for (const message of queueMessages) {
      await queue.enqueue(message);
    }

    const transactions = [
      { ...sampleVehicleTransaction, id: 'tx-1' },
      { ...sampleVehicleTransaction, id: 'tx-2' },
      { ...sampleVehicleTransaction, id: 'tx-3' },
    ];
    const transactionRepo = new InMemoryTransactionRepository(
      new Map(transactions.map((tx) => [tx.id, tx]))
    );

    const sut = new DequeueTransactionsUseCase(queue, transactionRepo);

    // Act
    const result = await sut.execute(2); // Only dequeue 2 items

    // Assert
    expect(result).toHaveLength(2);
    expect(result).toEqual([transactions[0], transactions[1]]);
  });
});
