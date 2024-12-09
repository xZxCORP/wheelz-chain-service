import type { ChainStateRepository } from '../../domain/repositories/chain-state.repository.js';

export class ResetChainStateUseCase {
  constructor(private readonly chainStateRepository: ChainStateRepository) {}

  async execute() {
    return await this.chainStateRepository.reset();
  }
}
