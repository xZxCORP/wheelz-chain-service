import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';

import type { ChainStateRepository } from '../../domain/repositories/chain-state.repository.js';

export class PersistTransactionToChainStateUseCase {
  constructor(private readonly chainStateRepository: ChainStateRepository) {}
  async execute(transaction: VehicleTransaction) {
    switch (transaction.action) {
      case 'create': {
        await this.chainStateRepository.saveVehicle(transaction.data);
        break;
      }
      case 'update': {
        await this.chainStateRepository.updateVehicle(
          transaction.data.vin,
          transaction.data.changes
        );
        break;
      }
      case 'delete': {
        await this.chainStateRepository.removeVehicle(transaction.data.vin);
        break;
      }
    }
  }
}
