import type { ChainStateRepository } from '../../domain/repositories/chain-state.repository.js';

export class GetVehicleOfTheChainByVinUseCase {
  constructor(private readonly chainStateRepository: ChainStateRepository) {}
  execute(vin: string) {
    return this.chainStateRepository.getVehicleByVin(vin);
  }
}
