import type { PaginationParameters } from '@zcorp/wheelz-contracts';

import type { ChainStateRepository } from '../../domain/repositories/chain-state.repository.js';

export class GetVehiclesOfTheChain {
  constructor(private readonly chainStateRepository: ChainStateRepository) {}

  async execute(paginationParameters: PaginationParameters) {
    return this.chainStateRepository.getVehicles(paginationParameters);
  }
}
