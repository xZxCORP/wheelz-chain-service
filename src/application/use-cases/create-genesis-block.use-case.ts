import type { Block } from '@zcorp/shared-typing-wheelz';

import type { ChainRepository } from '../../domain/repositories/chain.repository.js';
import type { DateProviderPort } from '../ports/date-provider.port.js';
import type { HasherPort } from '../ports/hasher.port.js';
import type { IdGeneratorPort } from '../ports/id-generator.port.js';

export class CreateGenesisBlockUseCase {
  constructor(
    private chainRepository: ChainRepository,
    private hasher: HasherPort,
    private dateProvider: DateProviderPort,
    private idGenerator: IdGeneratorPort
  ) {}

  async execute(): Promise<Block> {
    const existingBlock = await this.chainRepository.getLatestBlock();
    if (existingBlock) {
      throw new Error('Genesis block already exists');
    }

    const genesisBlock = await this.createGenesisBlock();
    await this.chainRepository.addBlock(genesisBlock);

    return genesisBlock;
  }

  private async createGenesisBlock(): Promise<Block> {
    const timestamp = this.dateProvider.now();
    const data = `Genesis Block - Created at ${timestamp.toISOString()}`;
    const hash = await this.hasher.hash(data);
    const id = await this.idGenerator.generate();
    return {
      id,
      previousHash: '0'.repeat(64),
      timestamp,
      transactions: [],
      hash,
    };
  }
}
