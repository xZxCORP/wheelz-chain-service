import type { Block } from '@zcorp/shared-typing-wheelz';

import type { ChainRepository } from '../../src/domain/repositories/chain.repository.js';

export class InMemoryChainRepository implements ChainRepository {
  constructor(private readonly blocks: Block[] = []) {}

  async getLatestBlock(): Promise<Block | null> {
    return this.blocks.at(-1) ?? null;
  }

  async addBlock(block: Block): Promise<void> {
    this.blocks.push(block);
  }

  async getBlocks(): Promise<Block[]> {
    return this.blocks;
  }

  async deleteBlocks(): Promise<void> {
    this.blocks.length = 0;
  }

  async isRunning(): Promise<boolean> {
    return true;
  }
}
