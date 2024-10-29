import type { ChainRepository } from '../../domain/repositories/chain.repository.js';

export class DeleteBlocksUseCase {
  constructor(private readonly chainRepository: ChainRepository) {}

  async execute(): Promise<void> {
    await this.chainRepository.deleteBlocks();
  }
}
