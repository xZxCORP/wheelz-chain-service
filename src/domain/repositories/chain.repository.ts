import type { Block } from '@zcorp/shared-typing-wheelz';

export interface ChainRepository {
  getLatestBlock(): Promise<Block | null>;
  addBlock(block: Block): Promise<void>;
  getBlocks(): Promise<Block[]>;
  deleteBlocks(): Promise<void>;
  isRunning(): Promise<boolean>;
}
