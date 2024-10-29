import { createVerify } from 'node:crypto';

import type { Signature } from '@zcorp/shared-typing-wheelz';

import type { DataSignerPort } from '../../../application/ports/data-signer.port.js';

export class CryptoDataSigner implements DataSignerPort {
  constructor(private readonly publicKey: string) {}
  verify(data: string, signature: Signature): Promise<boolean> {
    try {
      const signer = createVerify(signature.signAlgorithm);
      signer.update(data);

      const result = signer.verify(this.publicKey, signature.signature, 'hex');
      return Promise.resolve(result);
    } catch {
      throw new Error('Error while verify data');
    }
  }
}
