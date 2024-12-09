import type { Block } from '@zcorp/shared-typing-wheelz';

import type { ChainRepository } from '../../domain/repositories/chain.repository.js';

export class GetBlocksUseCase {
  constructor(private readonly chainRepository: ChainRepository) {}

  async execute(): Promise<Block[]> {
    return this.chainRepository.getBlocks();
  }
}
