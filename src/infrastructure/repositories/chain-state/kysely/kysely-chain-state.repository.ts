/* eslint-disable unicorn/import-style */
import { promises as fs } from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { UpdateVehicleTransactionChanges, Vehicle } from '@zcorp/shared-typing-wheelz';
import {
  FileMigrationProvider,
  Kysely,
  type MigrationResult,
  Migrator,
  MysqlDialect,
} from 'kysely';
import { createPool, type Pool } from 'mysql2';

import type { LoggerPort } from '../../../../application/ports/logger.port.js';
import type { ChainStateRepository } from '../../../../domain/repositories/chain-state.repository.js';
import type { ManagedResource } from '../../../managed.resource.js';
import type { KyselyChainStateDatabase } from './chain-state.database.js';
export interface KyselyConnection {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}
export type DeepPartial<T> = T extends object
  ? {
      [P in keyof T]?: DeepPartial<T[P]>;
    }
  : T;

export class KyselyChainStateRepository implements ChainStateRepository, ManagedResource {
  private pool: Pool | null = null;
  private migrator: Migrator | null = null;
  private db: Kysely<KyselyChainStateDatabase> | null = null;
  constructor(
    private readonly connection: KyselyConnection,
    private readonly logger: LoggerPort
  ) {}

  async getVehicles(): Promise<Vehicle[]> {
    const vins = await this.db?.selectFrom('vehicle').select('vehicle.vin').execute();
    if (!vins) {
      return [];
    }
    const mappedVehicles = await Promise.all(
      vins.map((item) => this.mapInternalVehicleToVehicle(item.vin))
    );
    return mappedVehicles.filter((item) => item !== null);
  }
  async getVehicleByVin(vin: string): Promise<Vehicle | null> {
    return this.mapInternalVehicleToVehicle(vin);
  }
  async getVehicleByLicensePlate(lciensePlate: string): Promise<Vehicle | null> {
    const vehicle = await this.db
      ?.selectFrom('vehicle')
      .innerJoin('vehicle_infos', 'vehicle_infos.vehicle_id', 'vehicle.id')
      .where('vehicle_infos.license_plate', '=', lciensePlate)
      .select(['vehicle.id', 'vehicle.vin'])
      .executeTakeFirst();
    if (!vehicle) {
      return null;
    }
    return this.mapInternalVehicleToVehicle(vehicle.vin);
  }
  async saveVehicle(vehicle: Vehicle): Promise<boolean> {
    const insertedVehicleResult = await this.db
      ?.insertInto('vehicle')
      .values({ vin: vehicle.vin })
      .executeTakeFirst();
    if (!insertedVehicleResult || !insertedVehicleResult.insertId) {
      return false;
    }
    const vehicleId = insertedVehicleResult.insertId;

    const insertedVehicleFeaturesResult = await this.db
      ?.insertInto('vehicle_features')
      .values({
        vehicle_id: Number(vehicleId),
        brand: vehicle.features.brand,
        model: vehicle.features.model,
        cv_power: vehicle.features.cvPower,
        color: vehicle.features.color,
        tvv: vehicle.features.tvv,
        cnit_number: vehicle.features.cnitNumber,
        reception_type: vehicle.features.receptionType,
        technically_admissible_ptac: vehicle.features.technicallyAdmissiblePTAC,
        ptac: vehicle.features.ptac,
        ptra: vehicle.features.ptra,
        pt_service: vehicle.features.ptService,
        ptav: vehicle.features.ptav,
        category: vehicle.features.category,
        gender: vehicle.features.gender,
        ce_body: vehicle.features.ceBody,
        national_body: vehicle.features.nationalBody,
        reception_number: vehicle.features.receptionNumber,
        displacement: vehicle.features.displacement,
        net_power: vehicle.features.netPower,
        energy: vehicle.features.energy,
        seating_number: vehicle.features.seatingNumber,
        standing_places_number: vehicle.features.standingPlacesNumber,
        sonorous_power_level: vehicle.features.sonorousPowerLevel,
        engine_speed: vehicle.features.engineSpeed,
        co2_emission: vehicle.features.co2Emission,
        pollution_code: vehicle.features.pollutionCode,
        power_mass_ratio: vehicle.features.powerMassRatio,
      })
      .executeTakeFirst();
    if (!insertedVehicleFeaturesResult || !insertedVehicleFeaturesResult.insertId) {
      return false;
    }
    const insertedVehicleInfosResult = await this.db
      ?.insertInto('vehicle_infos')
      .values({
        vehicle_id: Number(vehicleId),
        holder_count: vehicle.infos.holderCount,
        first_registration_in_france_date: vehicle.infos.firstRegistrationInFranceDate,
        first_siv_registration_date: vehicle.infos.firstSivRegistrationDate,
        license_plate: vehicle.infos.licensePlate,
        siv_conversion_date: vehicle.infos.sivConversionDate,
      })
      .executeTakeFirst();
    if (!insertedVehicleInfosResult || !insertedVehicleInfosResult.insertId) {
      return false;
    }
    if (vehicle.history.length > 0) {
      const insertedVehicleHistoryItemResult = await this.db
        ?.insertInto('vehicle_history_item')
        .values(
          vehicle.history.map((item) => ({
            vehicle_id: Number(vehicleId),
            date: item.date,
            type: item.type,
          }))
        )
        .executeTakeFirst();
      if (!insertedVehicleHistoryItemResult || !insertedVehicleHistoryItemResult.insertId) {
        return false;
      }
    }
    if (vehicle.technicalControls.length > 0) {
      const insertedVehicleTechnicalControlItemResult = await this.db
        ?.insertInto('vehicle_technical_control_item')
        .values(
          vehicle.technicalControls.map((item) => ({
            vehicle_id: Number(vehicleId),
            date: item.date,
            result: item.result,
            result_raw: item.resultRaw,
            nature: item.nature,
            km: item.km,
          }))
        )
        .executeTakeFirst();
      if (
        !insertedVehicleTechnicalControlItemResult ||
        !insertedVehicleTechnicalControlItemResult.insertId
      ) {
        return false;
      }
    }
    const insertedVehicleSinisterInfosResult = await this.db
      ?.insertInto('vehicle_sinister_infos')
      .values({
        vehicle_id: Number(vehicleId),
        count: vehicle.sinisterInfos.count,
        last_resolution_date: vehicle.sinisterInfos.lastResolutionDate,
        last_sinister_date: vehicle.sinisterInfos.lastSinisterDate,
      })
      .executeTakeFirst();
    if (!insertedVehicleSinisterInfosResult || !insertedVehicleSinisterInfosResult.insertId) {
      return false;
    }
    return true;
  }
  async updateVehicleByVin(
    vin: string,
    changes: UpdateVehicleTransactionChanges
  ): Promise<boolean> {
    const vehicle = await this.db
      ?.selectFrom('vehicle')
      .where('vehicle.vin', '=', vin)
      .select('id')
      .executeTakeFirst();
    if (!vehicle) {
      return false;
    }
    if (changes.features) {
      const updatedVehicleFeaturesResult = await this.db
        ?.updateTable('vehicle_features')
        .set({
          brand: changes.features.brand,
          model: changes.features.model,
          cv_power: changes.features.cvPower,
          color: changes.features.color,
          tvv: changes.features.tvv,
          cnit_number: changes.features.cnitNumber,
          reception_type: changes.features.receptionType,
          technically_admissible_ptac: changes.features.technicallyAdmissiblePTAC,
          ptac: changes.features.ptac,
          ptra: changes.features.ptra,
          pt_service: changes.features.ptService,
          ptav: changes.features.ptav,
          category: changes.features.category,
          gender: changes.features.gender,
          ce_body: changes.features.ceBody,
          national_body: changes.features.nationalBody,
          reception_number: changes.features.receptionNumber,
          displacement: changes.features.displacement,
          net_power: changes.features.netPower,
          energy: changes.features.energy,
          seating_number: changes.features.seatingNumber,
          standing_places_number: changes.features.standingPlacesNumber,
          sonorous_power_level: changes.features.sonorousPowerLevel,
          engine_speed: changes.features.engineSpeed,
          co2_emission: changes.features.co2Emission,
          pollution_code: changes.features.pollutionCode,
          power_mass_ratio: changes.features.powerMassRatio,
        })
        .where('vehicle_features.vehicle_id', '=', vehicle.id)
        .executeTakeFirst();
      if (!updatedVehicleFeaturesResult) {
        return false;
      }
    }
    if (changes.infos) {
      const updatedVehicleInfosResult = await this.db
        ?.updateTable('vehicle_infos')
        .set({
          holder_count: changes.infos.holderCount,
          first_registration_in_france_date: changes.infos.firstRegistrationInFranceDate,
          first_siv_registration_date: changes.infos.firstSivRegistrationDate,
          license_plate: changes.infos.licensePlate,
          siv_conversion_date: changes.infos.sivConversionDate,
        })
        .where('vehicle_infos.vehicle_id', '=', vehicle.id)
        .executeTakeFirst();
      if (!updatedVehicleInfosResult) {
        return false;
      }
    }
    if (changes.sinisterInfos) {
      const updatedVehicleSinisterInfosResult = await this.db
        ?.updateTable('vehicle_sinister_infos')
        .set({
          count: changes.sinisterInfos.count,
          last_resolution_date: changes.sinisterInfos.lastResolutionDate,
          last_sinister_date: changes.sinisterInfos.lastSinisterDate,
        })
        .where('vehicle_sinister_infos.vehicle_id', '=', vehicle.id)
        .executeTakeFirst();
      if (!updatedVehicleSinisterInfosResult) {
        return false;
      }
    }
    if (changes.history) {
      const deletePreviousHistoryItemsResult = await this.db
        ?.deleteFrom('vehicle_history_item')
        .where('vehicle_history_item.vehicle_id', '=', vehicle.id)
        .executeTakeFirst();
      if (!deletePreviousHistoryItemsResult) {
        return false;
      }
      const updatedVehicleHistoryItemResult = await this.db
        ?.insertInto('vehicle_history_item')
        .values(
          changes.history.map((item) => ({
            vehicle_id: Number(vehicle.id),
            date: item.date,
            type: item.type,
          }))
        )
        .executeTakeFirst();
      if (!updatedVehicleHistoryItemResult) {
        return false;
      }
    }
    if (changes.technicalControls) {
      const deletePreviousTechnicalControlItemsResult = await this.db
        ?.deleteFrom('vehicle_technical_control_item')
        .where('vehicle_technical_control_item.vehicle_id', '=', vehicle.id)
        .executeTakeFirst();
      if (!deletePreviousTechnicalControlItemsResult) {
        return false;
      }
      const updatedVehicleTechnicalControlItemResult = await this.db
        ?.insertInto('vehicle_technical_control_item')
        .values(
          changes.technicalControls.map((item) => ({
            vehicle_id: Number(vehicle.id),
            date: item.date,
            result: item.result,
            result_raw: item.resultRaw,
            nature: item.nature,
            km: item.km,
          }))
        )
        .executeTakeFirst();
      if (!updatedVehicleTechnicalControlItemResult) {
        return false;
      }
    }
    return true;
  }
  async removeVehicleByVin(id: string): Promise<boolean> {
    const result = await this.db
      ?.deleteFrom('vehicle')
      .where('vehicle.vin', '=', id)
      .executeTakeFirst();
    if (result && result.numDeletedRows > 0) {
      return true;
    }
    return false;
  }
  async isRunning(): Promise<boolean> {
    if (!this.pool) {
      return false;
    }
    return new Promise((resolve) => {
      this.pool!.getConnection((error, connection) => {
        if (error) {
          resolve(false);
        } else {
          connection.ping((pingError) => {
            if (pingError) {
              resolve(false);
            } else {
              connection.release();
              resolve(true);
            }
          });
        }
      });
    });
  }
  async reset(): Promise<boolean> {
    if (this.db) {
      await Promise.all([
        this.db.deleteFrom('vehicle_sinister_infos').execute(),
        this.db.deleteFrom('vehicle_technical_control_item').execute(),
        this.db.deleteFrom('vehicle_history_item').execute(),
        this.db.deleteFrom('vehicle_infos').execute(),
        this.db.deleteFrom('vehicle_features').execute(),
        this.db.deleteFrom('vehicle').execute(),
      ]);
      return true;
    }
    return false;
  }

  async initialize(): Promise<void> {
    const pool = createPool({
      database: this.connection.database,
      host: this.connection.host,
      port: this.connection.port,
      user: this.connection.username,
      password: this.connection.password,
      connectionLimit: 10,
    });

    const dialect = new MysqlDialect({
      pool,
    });
    this.pool = pool;
    this.db = new Kysely<KyselyChainStateDatabase>({
      dialect,
    });
    const connected = await this.isRunning();
    if (!connected) {
      throw new Error('Chain state database is not running');
    }
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);

    this.migrator = new Migrator({
      db: this.db,
      provider: new FileMigrationProvider({
        fs,
        path,
        migrationFolder: path.join(__dirname, 'migrations'),
      }),
    });
    const { error, results } = await this.migrator.migrateToLatest();

    if (results) {
      this.logResults(results);
    }

    if (error) {
      this.logger.error('failed to migrate');
      this.logger.error('error: ', error);
      process.exit(1);
    }
  }
  async dispose(): Promise<void> {
    if (this.db) {
      this.db.destroy();
      this.db = null;
      this.pool = null;
    }
    return;
  }
  logResults(results: MigrationResult[]): void {
    for (const it of results) {
      if (it.status === 'Success') {
        this.logger.info(
          `migration "${it.migrationName}" was executed successfully => ${it.direction}`
        );
      } else if (it.status === 'Error') {
        this.logger.error(`failed to execute migration "${it.migrationName}"`);
      }
    }
  }
  async mapInternalVehicleToVehicle(vin: string): Promise<Vehicle | null> {
    const joinedVehicle = await this.db
      ?.selectFrom('vehicle')
      .where('vehicle.vin', '=', vin)
      .innerJoin('vehicle_features', 'vehicle_features.vehicle_id', 'vehicle.id')
      .innerJoin('vehicle_infos', 'vehicle_infos.vehicle_id', 'vehicle.id')

      .innerJoin('vehicle_sinister_infos', 'vehicle_sinister_infos.vehicle_id', 'vehicle.id')
      .selectAll()
      .executeTakeFirst();
    if (!joinedVehicle) {
      return null;
    }
    const historyItems = await this.db
      ?.selectFrom('vehicle_history_item')
      .where('vehicle_history_item.vehicle_id', '=', joinedVehicle.id)
      .selectAll()
      .execute();
    const technicalControlItems = await this.db
      ?.selectFrom('vehicle_technical_control_item')
      .where('vehicle_technical_control_item.vehicle_id', '=', joinedVehicle.id)
      .selectAll()
      .execute();
    const mappedVehicle: Vehicle = {
      vin,
      features: {
        brand: joinedVehicle.brand,
        model: joinedVehicle.model,
        cvPower: joinedVehicle.cv_power,
        color: joinedVehicle.color,
        tvv: joinedVehicle.tvv,
        cnitNumber: joinedVehicle.cnit_number,
        receptionType: joinedVehicle.reception_type,
        technicallyAdmissiblePTAC: joinedVehicle.technically_admissible_ptac,
        ptac: joinedVehicle.ptac,
        ptra: joinedVehicle.ptra,
        ptService: joinedVehicle.pt_service,
        ptav: joinedVehicle.ptav,
        category: joinedVehicle.category,
        gender: joinedVehicle.gender,
        ceBody: joinedVehicle.ce_body,
        nationalBody: joinedVehicle.national_body,
        receptionNumber: joinedVehicle.reception_number,
        displacement: joinedVehicle.displacement,
        netPower: joinedVehicle.net_power,
        energy: joinedVehicle.energy,
        seatingNumber: joinedVehicle.seating_number,
        standingPlacesNumber: joinedVehicle.standing_places_number,
        sonorousPowerLevel: joinedVehicle.sonorous_power_level,
        engineSpeed: joinedVehicle.engine_speed,
        co2Emission: joinedVehicle.co2_emission,
        pollutionCode: joinedVehicle.pollution_code,
        powerMassRatio: joinedVehicle.power_mass_ratio,
      },
      infos: {
        holderCount: joinedVehicle.holder_count,
        firstRegistrationInFranceDate: joinedVehicle.first_registration_in_france_date,
        firstSivRegistrationDate: joinedVehicle.first_siv_registration_date,
        licensePlate: joinedVehicle.license_plate,
        sivConversionDate: joinedVehicle.siv_conversion_date,
      },
      history: (historyItems || []).map((item) => ({
        date: item.date,
        type: item.type,
      })),
      technicalControls: (technicalControlItems || []).map((item) => ({
        date: item.date,
        result: item.result,
        resultRaw: item.result_raw,
        nature: item.nature,
        km: item.km,
      })),
      sinisterInfos: {
        count: joinedVehicle.count,
        lastResolutionDate: joinedVehicle.last_resolution_date,
        lastSinisterDate: joinedVehicle.last_sinister_date,
      },
    };
    return mappedVehicle;
  }
}
