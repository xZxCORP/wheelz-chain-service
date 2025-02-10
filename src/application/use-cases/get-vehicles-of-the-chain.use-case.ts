import type { PaginationParameters } from '@zcorp/wheelz-contracts';

import type { ChainStateRepository } from '../../domain/repositories/chain-state.repository.js';

export class GetVehiclesOfTheChainUseCase {
  constructor(private readonly chainStateRepository: ChainStateRepository) {}

  async execute(paginationParameters: PaginationParameters, allowedUserIds?: string[]) {
    return this.chainStateRepository.getVehicles(paginationParameters, allowedUserIds);
  }
}
