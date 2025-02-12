import type { ChainStateRepository } from '../../domain/repositories/chain-state.repository.js';

export class GetVehicleOfTheChainByLicensePlateUseCase {
  constructor(private readonly chainStateRepository: ChainStateRepository) {}
  execute(licensePlate: string) {
    return this.chainStateRepository.getVehicleByLicensePlate(licensePlate);
  }
}
