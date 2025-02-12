import type {
  UpdateVehicleTransactionChanges,
  VehicleWithUserId,
} from '@zcorp/shared-typing-wheelz';
import type { PaginatedVehicles, PaginationParameters } from '@zcorp/wheelz-contracts';

export interface ChainStateRepository {
  getVehicles(
    paginationParameters: PaginationParameters,
    allowedUserIds?: string[],
    allowedClientsIds?: string[]
  ): Promise<PaginatedVehicles>;
  getVehicleByVin(vin: string): Promise<VehicleWithUserId | null>;
  getVehicleByLicensePlate(licensePlate: string): Promise<VehicleWithUserId | null>;
  saveVehicle(vehicle: VehicleWithUserId): Promise<boolean>;
  updateVehicleByVin(vin: string, changes: UpdateVehicleTransactionChanges): Promise<boolean>;
  removeVehicleByVin(id: string): Promise<boolean>;
  isRunning(): Promise<boolean>;
  reset(): Promise<boolean>;
}
