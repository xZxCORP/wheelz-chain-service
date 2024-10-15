import type { ChainRepository } from '../../domain/repositories/chain.repository.js';

export class IsChainInitializedUseCase {
  constructor(private readonly chainRepository: ChainRepository) {}

  async execute(): Promise<boolean> {
    const latestBlock = this.chainRepository.getLatestBlock();
    return !!latestBlock;
  }
}
