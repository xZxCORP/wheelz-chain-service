import type { PaginationParameters } from '@zcorp/wheelz-contracts';

import type { GetBlocksUseCase } from '../use-cases/get-blocks.use-case.js';
import type { GetVehicleOfTheChainByLicensePlate } from '../use-cases/get-vehicle-of-the-chain-by-licence-plate.js';
import type { GetVehicleOfTheChainByVin } from '../use-cases/get-vehicle-of-the-chain-by-vin.js';
import type { GetVehiclesOfTheChain } from '../use-cases/get-vehicles-of-the-chain.use-case.js';
import type { PersistTransactionToChainStateUseCase } from '../use-cases/persist-transaction-to-chain-state.use-case.js';
import type { ResetChainStateUseCase } from '../use-cases/reset-chain-state.use-case.js';
import type { ChainService } from './chain.service.js';

export class ChainStateService {
  constructor(
    private readonly persistTransactionToChainStateUseCase: PersistTransactionToChainStateUseCase,
    private readonly resetChainStateUseCase: ResetChainStateUseCase,
    private readonly getBlocksUseCase: GetBlocksUseCase,
    private readonly getVehicleOfTheChainByVin: GetVehicleOfTheChainByVin,
    private readonly getVehicleOfTheChainByLicensePlate: GetVehicleOfTheChainByLicensePlate,
    private readonly getVehiclesOfTheChain: GetVehiclesOfTheChain,
    private readonly chainService: ChainService
  ) {}

  async refreshChainState() {
    const verifyChain = await this.chainService.verifyChain();
    if (!verifyChain) {
      throw new Error("La chaine n'est pas valide");
    }
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
  async getVehicles(paginationParameters: PaginationParameters) {
    return this.getVehiclesOfTheChain.execute(paginationParameters);
  }
}
