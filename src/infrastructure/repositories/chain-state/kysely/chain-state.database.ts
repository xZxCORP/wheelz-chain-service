import type { Generated, Insertable, Selectable, Updateable } from 'kysely';
export interface KyselyChainStateDatabase {
  vehicle: KyselyVehicleTable;
}
export interface KyselyVehicleTable {
  id: Generated<number>;
  constructor_name: string;
  model: string;
  year: number;
  vin: string;
}

export type KyselyVehicle = Selectable<KyselyVehicleTable>;
export type NewKyselyVehicle = Insertable<KyselyVehicleTable>;
export type KyselyVehicleUpdate = Updateable<KyselyVehicleTable>;
