import type { UpdateVehicleTransactionChanges, Vehicle } from '@zcorp/shared-typing-wheelz';
import type { PaginatedVehicles, PaginationParameters } from '@zcorp/wheelz-contracts';

export interface ChainStateRepository {
  getVehicles(
    paginationParameters: PaginationParameters,
    allowedUserIds?: string[],
    allowedClientsIds?: string[]
  ): Promise<PaginatedVehicles>;
  getVehicleByVin(vin: string): Promise<Vehicle | null>;
  getVehicleByLicensePlate(licensePlate: string): Promise<Vehicle | null>;
  saveVehicle(vehicle: Vehicle): Promise<boolean>;
  updateVehicleByVin(vin: string, changes: UpdateVehicleTransactionChanges): Promise<boolean>;
  removeVehicleByVin(id: string): Promise<boolean>;
  isRunning(): Promise<boolean>;
  reset(): Promise<boolean>;
}
