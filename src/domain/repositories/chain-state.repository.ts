import type { Vehicle } from '@zcorp/shared-typing-wheelz';

export interface ChainStateRepository {
  getVehicles(): Promise<Vehicle[]>;
  getVehicleById(id: string): Promise<Vehicle | null>;
  saveVehicle(vehicle: Vehicle): Promise<void>;
  updateVehicle(vin: string, vehicle: Partial<Vehicle>): Promise<void>;
  removeVehicle(id: string): Promise<void>;
  isRunning(): Promise<boolean>;
  reset(): Promise<boolean>;
}
