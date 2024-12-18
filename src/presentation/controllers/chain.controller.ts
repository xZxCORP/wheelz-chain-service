import type { PaginationParameters } from '@zcorp/wheelz-contracts';

import type { ChainStateService } from '../../application/services/chain-state.service.js';

export class ChainController {
  constructor(private readonly chainStateService: ChainStateService) {}

  getVehicleOfTheChainByVin(vin: string) {
    return this.chainStateService.getVehicleByVin(vin);
  }
  getVehicleOfTheChainByLicensePlate(licensePlate: string) {
    return this.chainStateService.getVehicleByLicensePlate(licensePlate);
  }
  getVehiclesOfTheChain(paginationParameters: PaginationParameters) {
    return this.chainStateService.getVehicles(paginationParameters);
  }
}
