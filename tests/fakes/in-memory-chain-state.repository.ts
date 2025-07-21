import type {
  UpdateVehicleTransactionChanges,
  VehicleWithUserId,
} from '@zcorp/shared-typing-wheelz';
import type { PaginatedVehicles, PaginationParameters } from '@zcorp/wheelz-contracts';

import type { ChainStateRepository } from '../../src/domain/repositories/chain-state.repository.js';

export class InMemoryChainStateRepository implements ChainStateRepository {
  constructor(private vehicles: Map<string, VehicleWithUserId> = new Map()) {}

  async getVehicles(
    paginationParameters: PaginationParameters,
    allowedUserIds?: string[],
    allowedClientsIds?: string[]
  ): Promise<PaginatedVehicles> {
    let filteredVehicles = [...this.vehicles.values()];

    if (allowedUserIds) {
      filteredVehicles = filteredVehicles.filter((v) => allowedUserIds.includes(v.userId));
    }

    if (allowedClientsIds) {
      filteredVehicles = filteredVehicles.filter((v) =>
        v.attachedClientsIds.some((id) => allowedClientsIds.includes(id))
      );
    }

    const start = (paginationParameters.page - 1) * paginationParameters.perPage;
    const end = start + paginationParameters.perPage;
    const items = filteredVehicles.slice(start, end);

    return {
      items,
      meta: {
        page: paginationParameters.page,
        perPage: paginationParameters.perPage,
        total: filteredVehicles.length,
      },
    };
  }

  async getVehicleByVin(vin: string): Promise<VehicleWithUserId | null> {
    return this.vehicles.get(vin) ?? null;
  }

  async getVehicleByLicensePlate(licensePlate: string): Promise<VehicleWithUserId | null> {
    return [...this.vehicles.values()].find((v) => v.infos.licensePlate === licensePlate) ?? null;
  }

  async saveVehicle(vehicle: VehicleWithUserId): Promise<boolean> {
    this.vehicles.set(vehicle.vin, vehicle);
    return true;
  }

  async updateVehicleByVin(
    vin: string,
    changes: UpdateVehicleTransactionChanges,
    userId: string
  ): Promise<boolean> {
    const vehicle = this.vehicles.get(vin);
    if (!vehicle) return false;

    const updatedVehicle = { ...vehicle };

    if (changes.features) {
      updatedVehicle.features = { ...updatedVehicle.features, ...changes.features };
    }
    if (changes.infos) {
      updatedVehicle.infos = { ...updatedVehicle.infos, ...changes.infos };
    }
    if (changes.history) {
      updatedVehicle.history = changes.history;
    }
    if (changes.technicalControls) {
      updatedVehicle.technicalControls = changes.technicalControls;
    }
    if (changes.sinisterInfos) {
      updatedVehicle.sinisterInfos = { ...updatedVehicle.sinisterInfos, ...changes.sinisterInfos };
    }
    if (changes.attachedClientsIds) {
      updatedVehicle.attachedClientsIds = changes.attachedClientsIds;
    }

    updatedVehicle.userId = userId;
    this.vehicles.set(vin, updatedVehicle);
    return true;
  }

  async removeVehicleByVin(vin: string): Promise<boolean> {
    return this.vehicles.delete(vin);
  }

  async isRunning(): Promise<boolean> {
    return true;
  }

  async reset(): Promise<boolean> {
    this.vehicles.clear();
    return true;
  }
}
