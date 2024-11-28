import type { GetBlocksUseCase } from '../use-cases/get-blocks.use-case.js';
import type { GetVehicleOfTheChainByLicensePlate } from '../use-cases/get-vehicle-of-the-chain-by-licence-plate.js';
import type { GetVehicleOfTheChainByVin } from '../use-cases/get-vehicle-of-the-chain-by-vin.js';
import type { PersistTransactionToChainStateUseCase } from '../use-cases/persist-transaction-to-chain-state.use-case.js';
import type { ResetChainStateUseCase } from '../use-cases/reset-chain-state.use-case.js';

export class ChainStateService {
  constructor(
    private readonly persistTransactionToChainStateUseCase: PersistTransactionToChainStateUseCase,
    private readonly resetChainStateUseCase: ResetChainStateUseCase,
    private readonly getBlocksUseCase: GetBlocksUseCase,
    private readonly getVehicleOfTheChainByVin: GetVehicleOfTheChainByVin,
    private readonly getVehicleOfTheChainByLicensePlate: GetVehicleOfTheChainByLicensePlate
  ) {}

  async refreshChainState() {
    await this.resetChainStateUseCase.execute();
    const blocks = await this.getBlocksUseCase.execute();
    const sortedBlocks = blocks.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    for (const block of sortedBlocks) {
      const sortedTransactions = block.transactions.sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      for (const transaction of sortedTransactions) {
        await this.persistTransactionToChainStateUseCase.execute(transaction);
      }
    }
  }

  async getVehicleByVin(vin: string) {
    return this.getVehicleOfTheChainByVin.execute(vin);
  }
  async getVehicleByLicensePlate(licensePlate: string) {
    return this.getVehicleOfTheChainByLicensePlate.execute(licensePlate);
  }
}
