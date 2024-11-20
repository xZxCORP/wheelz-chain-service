import type { Vehicle } from '@zcorp/shared-typing-wheelz';

export interface ChainStateRepository {
  getVehicles(): Promise<Vehicle[]>;
  getVehicleByVin(vin: string): Promise<Vehicle | null>;
  saveVehicle(vehicle: Vehicle): Promise<boolean>;
  updateVehicleByVin(vin: string, vehicle: Partial<Vehicle>): Promise<boolean>;
  removeVehicleByVin(id: string): Promise<boolean>;
  isRunning(): Promise<boolean>;
  reset(): Promise<boolean>;
}
