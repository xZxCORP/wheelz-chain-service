import { randomUUID } from 'node:crypto';

import type { IdGeneratorPort } from '../../../application/ports/id-generator.port.js';

export class UuidIdGenerator implements IdGeneratorPort {
  async generate(): Promise<string> {
    return randomUUID();
  }
}
