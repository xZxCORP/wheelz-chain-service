import type { Block } from '@zcorp/shared-typing-wheelz';

import type { BlockData } from '../../domain/entities/block-data.entity.js';
import type { BlockDataPreparationService } from '../../domain/service/block-data-preparation.service.js';
import type { HasherPort } from '../ports/hasher.port.js';

export class VerifyBlockPairUseCase {
  constructor(
    private readonly blockDataPreparationService: BlockDataPreparationService,
    private readonly hasher: HasherPort
  ) {}

  async execute(block: Block, previousBlock: Block): Promise<boolean> {
    return this.isValidBlock(block, previousBlock);
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
