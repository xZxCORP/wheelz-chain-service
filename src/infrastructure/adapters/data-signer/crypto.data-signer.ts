import type { SignAlgorithm, Signature } from '@zcorp/shared-typing-wheelz';

import type { DataSignerPort } from '../../../application/ports/data-signer.port.js';

export class CryptoDataSigner implements DataSignerPort {
  constructor(
    private readonly signAlgorithm: SignAlgorithm,
    private readonly publicKey: string
  ) {}
  verify(data: string, signature: Signature): Promise<boolean> {
    return Promise.resolve(false);
  }
}
