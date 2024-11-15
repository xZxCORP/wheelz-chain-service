import type { Generated, Insertable, Selectable, Updateable } from 'kysely';
export interface KyselyChainStateDatabase {
  vehicle: KyselyVehicleTable;
  vehicle_features: KyselyVehicleFeaturesTable;
  vehicle_infos: KyselyVehicleInfosTable;
  vehicle_history_item: KyselyVehicleHistoryItemTable;
  vehicle_technical_control_item: KyselyTechnicalControlItemTable;
  vehicle_sinister_infos: KyselySinisterInfosTable;
}
export interface KyselyVehicleTable {
  id: Generated<number>;
  vin: string;
  created_at: Date;
}

export type KyselyVehicle = Selectable<KyselyVehicleTable>;
export type NewKyselyVehicle = Insertable<KyselyVehicleTable>;
export type KyselyVehicleUpdate = Updateable<KyselyVehicleTable>;

export interface KyselyVehicleFeaturesTable {
  id: Generated<number>;
  vehicle_id: number;
  brand: string;
  model: string;
  cv_power: number;
  color: string;
  tvv: string;
  cnit_number: string;
  reception_type: string;
  technically_admissible_ptac: number;
  ptac: number;
  ptra: number;
  pt_service: number;
  ptav: number;
  category: string;
  gender: string;
  ce_body: string;
  national_body: string;
  reception_number: string;
  displacement: number;
  net_power: number;
  energy: string;
  seating_number: number;
  standing_places_number: number;
  sonorous_power_level: number;
  engine_speed: number;
  co2_emission: number;
  pollution_code: string;
  power_mass_ratio: number;
  created_at: Date;
}

export type KyselyVehicleFeatures = Selectable<KyselyVehicleFeaturesTable>;
export type NewKyselyVehicleFeatures = Insertable<KyselyVehicleFeaturesTable>;
export type KyselyVehicleFeaturesUpdate = Updateable<KyselyVehicleFeaturesTable>;

export interface KyselyVehicleInfosTable {
  id: Generated<number>;
  vehicle_id: number;
  holder_count: number;
  first_registration_in_france_date: string;
  first_siv_registration_date: string;
  license_plate: string;
  siv_conversion_date: string;
  created_at: Date;
}

export type KyselyVehicleInfos = Selectable<KyselyVehicleInfosTable>;
export type NewKyselyVehicleInfos = Insertable<KyselyVehicleInfosTable>;
export type KyselyVehicleInfosUpdate = Updateable<KyselyVehicleInfosTable>;

export interface KyselyVehicleHistoryItemTable {
  id: Generated<number>;
  vehicle_id: number;
  type: string;
  date: string;
  created_at: Date;
}

export type KyselyVehicleHistoryItem = Selectable<KyselyVehicleHistoryItemTable>;
export type NewKyselyVehicleHistoryItem = Insertable<KyselyVehicleHistoryItemTable>;
export type KyselyVehicleHistoryItemUpdate = Updateable<KyselyVehicleHistoryItemTable>;

export interface KyselyTechnicalControlItemTable {
  id: Generated<number>;
  vehicle_id: number;
  date: string;
  result: string;
  result_raw: string;
  nature: string;
  km: number;
  created_at: Date;
}

export type KyselyTechnicalControlItem = Selectable<KyselyTechnicalControlItemTable>;
export type NewKyselyTechnicalControlItem = Insertable<KyselyTechnicalControlItemTable>;
export type KyselyTechnicalControlItemUpdate = Updateable<KyselyTechnicalControlItemTable>;

export interface KyselySinisterInfosTable {
  id: Generated<number>;
  vehicle_id: number;
  count: number;
  last_resolution_date: string;
  last_sinister_date: string;
  created_at: Date;
}

export type KyselySinisterInfos = Selectable<KyselySinisterInfosTable>;
export type NewKyselySinisterInfos = Insertable<KyselySinisterInfosTable>;
export type KyselySinisterInfosUpdate = Updateable<KyselySinisterInfosTable>;
