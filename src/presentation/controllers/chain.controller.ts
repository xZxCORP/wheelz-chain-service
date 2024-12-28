import type { PaginationParameters } from '@zcorp/wheelz-contracts';

import type { ChainService } from '../../application/services/chain.service.js';
import type { ChainStateService } from '../../application/services/chain-state.service.js';

export class ChainController {
  constructor(
    private readonly chainStateService: ChainStateService,
    private readonly chainService: ChainService
  ) {}

  getVehicleOfTheChainByVin(vin: string) {
    return this.chainStateService.getVehicleByVin(vin);
  }
  getVehicleOfTheChainByLicensePlate(licensePlate: string) {
    return this.chainStateService.getVehicleByLicensePlate(licensePlate);
  }
  getVehiclesOfTheChain(paginationParameters: PaginationParameters) {
    return this.chainStateService.getVehicles(paginationParameters);
  }
  refreshChain() {
    return this.chainStateService.refreshChainState();
  }
  processTransactionBatch(batchSize: number = 10) {
    return this.chainService.processTransactionBatch(batchSize);
  }
  verifyChain() {
    return this.chainService.verifyChain();
  }
  getChainStats() {
    return this.chainService.getChainStats();
  }
}
