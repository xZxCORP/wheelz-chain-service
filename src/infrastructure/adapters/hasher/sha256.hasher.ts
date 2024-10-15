import { createHash } from 'node:crypto';

import type { HasherPort } from '../../../application/ports/hasher.port.js';

export class Sha256Hasher implements HasherPort {
  async hash(data: string): Promise<string> {
    return createHash('sha256').update(data).digest('hex');
  }
}
