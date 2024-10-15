import type { Block } from '@zcorp/shared-typing-wheelz';

export type BlockData = Omit<Block, 'id' | 'hash'>;
