import type { Block, VehicleTransaction } from '@zcorp/shared-typing-wheelz';

import type { BlockData } from '../../domain/entities/block-data.entity.js';
import type { ChainRepository } from '../../domain/repositories/chain.repository.js';
import type { BlockDataPreparationService } from '../../domain/service/block-data-preparation.service.js';
import type { DateProviderPort } from '../ports/date-provider.port.js';
import type { HasherPort } from '../ports/hasher.port.js';
import type { IdGeneratorPort } from '../ports/id-generator.port.js';

export class CreateBlockUseCase {
  constructor(
    private readonly chainRepository: ChainRepository,
    private readonly dateProvider: DateProviderPort,
    private readonly hasher: HasherPort,
    private readonly idGenerator: IdGeneratorPort,
    private blockDataPreparationService: BlockDataPreparationService
  ) {}
  async execute(transactions: VehicleTransaction[]): Promise<Block> {
    const latestBlock = await this.chainRepository.getLatestBlock();
    if (!latestBlock) {
      throw new Error('Chain is not initialized');
    }
    const newBlock = await this.createBlock(latestBlock.hash, transactions);
    await this.chainRepository.addBlock(newBlock);
    return newBlock;
  }

  private async createBlock(
    previousHash: string,
    transactions: VehicleTransaction[]
  ): Promise<Block> {
    const timestamp = this.dateProvider.now();
    const blockData: BlockData = { previousHash, timestamp, transactions };
    const dataToHash = this.blockDataPreparationService.prepareForHashing(blockData);
    const hash = await this.hasher.hash(dataToHash);
    const id = await this.idGenerator.generate();
    return {
      id,
      previousHash,
      timestamp,
      transactions,
      hash,
    };
  }
}
