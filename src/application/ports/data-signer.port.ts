import type { Signature } from '@zcorp/shared-typing-wheelz';

export interface DataSignerPort {
  verify(data: string, signature: Signature): Promise<boolean>;
}
