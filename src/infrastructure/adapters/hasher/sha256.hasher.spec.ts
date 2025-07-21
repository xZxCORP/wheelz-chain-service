import { createHash } from 'node:crypto';

import { describe, expect, it } from 'vitest';

import { Sha256Hasher } from './sha256.hasher.js';

describe('Sha256Hasher', () => {
  it('computes a SHA-256 hash matching node:crypto output', async () => {
    // Arrange
    const sut = new Sha256Hasher();
    const data = 'hello-world';
    const expected = createHash('sha256').update(data).digest('hex');

    // Act
    const actual = await sut.hash(data);

    // Assert
    expect(actual).toBe(expected);
  });
});
