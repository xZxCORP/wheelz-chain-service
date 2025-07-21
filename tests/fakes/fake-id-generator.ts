import type { IdGeneratorPort } from '../../src/application/ports/id-generator.port.js';

export class FakeIdGenerator implements IdGeneratorPort {
  private counter = 0;

  async generate(): Promise<string> {
    return `test-id-${++this.counter}`;
  }
}
