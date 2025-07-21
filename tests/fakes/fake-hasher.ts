import type { HasherPort } from '../../src/application/ports/hasher.port.js';

export class FakeHasher implements HasherPort {
  async hash(data: string): Promise<string> {
    return `hash:${data}`; // Deterministic hash for testing
  }
}
