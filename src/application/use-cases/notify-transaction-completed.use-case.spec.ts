import type { VehicleTransactionCompleted } from '@zcorp/shared-typing-wheelz';
import { describe, expect, it } from 'vitest';

import { FakeDateProvider } from '../../../tests/fakes/fake-date-provider.js';
import { InMemoryQueue } from '../../../tests/fakes/in-memory-queue.js';
import { NotifyTransactionCompletedUseCase } from './notify-transaction-completed.use-case.js';

describe('NotifyTransactionCompletedUseCase', () => {
  it('enqueues transaction completion message with correct data', async () => {
    // Arrange
    const queue = new InMemoryQueue();
    const fixedDate = new Date('2024-01-01T00:00:00Z');
    const dateProvider = new FakeDateProvider(fixedDate);
    const sut = new NotifyTransactionCompletedUseCase(queue, dateProvider);

    // Act
    const result = await sut.execute('tx-123', 'finished');

    // Assert
    expect(result).toBe(true);
    const enqueuedMessages = queue.getMessages();
    expect(enqueuedMessages).toHaveLength(1);
    expect(enqueuedMessages[0]).toEqual<VehicleTransactionCompleted>({
      transactionId: 'tx-123',
      newStatus: 'finished',
      completedAt: fixedDate,
    });
  });

  it('enqueues error status correctly', async () => {
    // Arrange
    const queue = new InMemoryQueue();
    const fixedDate = new Date('2024-01-01T00:00:00Z');
    const dateProvider = new FakeDateProvider(fixedDate);
    const sut = new NotifyTransactionCompletedUseCase(queue, dateProvider);

    // Act
    const result = await sut.execute('tx-123', 'error');

    // Assert
    expect(result).toBe(true);
    const enqueuedMessages = queue.getMessages();
    expect(enqueuedMessages).toHaveLength(1);
    expect(enqueuedMessages[0]).toEqual<VehicleTransactionCompleted>({
      transactionId: 'tx-123',
      newStatus: 'error',
      completedAt: fixedDate,
    });
  });

  it('returns false when queue enqueue fails', async () => {
    // Arrange
    const queue = new InMemoryQueue(false); // Simulate queue failure
    const dateProvider = new FakeDateProvider();
    const sut = new NotifyTransactionCompletedUseCase(queue, dateProvider);

    // Act
    const result = await sut.execute('tx-123', 'finished');

    // Assert
    expect(result).toBe(false);
  });
});
