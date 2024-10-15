import type { Block } from '@zcorp/shared-typing-wheelz';

export interface ChainRepository {
  getLatestBlock(): Promise<Block>;
  addBlock(block: Block): Promise<void>;
  getBlocks(): Promise<Block[]>;
}
