import type { Block } from '@zcorp/shared-typing-wheelz';

import type { BlockData } from '../../domain/entities/block-data.entity.js';
import type { ChainRepository } from '../../domain/repositories/chain.repository.js';
import type { BlockDataPreparationService } from '../../domain/service/block-data-preparation.service.js';
import type { HasherPort } from '../ports/hasher.port.js';

export class VerifyChainUseCase {
  constructor(
    private readonly chainRepository: ChainRepository,
    private readonly blockDataPreparationService: BlockDataPreparationService,
    private readonly hasher: HasherPort
  ) {}

  async execute(): Promise<boolean> {
    const blocks = await this.chainRepository.getBlocks();
    for (let index = 1; index < blocks.length; index++) {
      const currentBlock = blocks[index];
      const previousBlock = blocks[index - 1];
      if (!currentBlock || !previousBlock) {
        return false;
      }
      if (!this.isValidBlock(currentBlock, previousBlock)) {
        return false;
      }
    }

    return true;
  }
  private async isValidBlock(block: Block, previousBlock: Block): Promise<boolean> {
    if (block.previousHash !== previousBlock.hash) {
      return false;
    }

    const blockData: BlockData = {
      previousHash: block.previousHash,
      timestamp: block.timestamp,
      transactions: block.transactions,
    };

    const dataToHash = this.blockDataPreparationService.prepareForHashing(blockData);
    const hash = await this.hasher.hash(dataToHash);

    return hash === block.hash;
  }
}
