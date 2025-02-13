import type { VehicleTransaction } from '@zcorp/shared-typing-wheelz';

import type { ChainStateRepository } from '../../domain/repositories/chain-state.repository.js';

export class PersistTransactionToChainStateUseCase {
  constructor(private readonly chainStateRepository: ChainStateRepository) {}
  async execute(transaction: VehicleTransaction) {
    switch (transaction.action) {
      case 'create': {
        await this.chainStateRepository.saveVehicle({
          ...transaction.data,
          userId: transaction.userId,
        });
        break;
      }
      case 'update': {
        await this.chainStateRepository.updateVehicleByVin(
          transaction.data.vin,
          transaction.data.changes,
          transaction.userId
        );
        break;
      }
      case 'delete': {
        await this.chainStateRepository.removeVehicleByVin(transaction.data.vin);
        break;
      }
    }
  }
}
