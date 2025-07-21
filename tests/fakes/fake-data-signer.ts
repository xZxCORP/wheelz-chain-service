import type { Signature } from '@zcorp/shared-typing-wheelz';

import type { DataSignerPort } from '../../src/application/ports/data-signer.port.js';

export class FakeDataSigner implements DataSignerPort {
  constructor(private readonly shouldVerify: boolean = true) {}

  async verify(data: string, signature: Signature): Promise<boolean> {
    // Simulate signature verification by checking if data contains expected fields
    const parsedData = JSON.parse(data);
    const hasRequiredFields =
      'action' in parsedData &&
      'data' in parsedData &&
      'withAnomaly' in parsedData &&
      'userId' in parsedData;

    return this.shouldVerify && hasRequiredFields;
  }
}
