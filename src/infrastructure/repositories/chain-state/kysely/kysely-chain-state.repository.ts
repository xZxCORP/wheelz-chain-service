/* eslint-disable unicorn/import-style */
import { promises as fs } from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type {
  UpdateVehicleTransactionChanges,
  VehicleWithUserId,
} from '@zcorp/shared-typing-wheelz';
import type { PaginatedVehicles, Pagination, PaginationParameters } from '@zcorp/wheelz-contracts';
import {
  FileMigrationProvider,
  Kysely,
  type MigrationResult,
  Migrator,
  PostgresDialect,
} from 'kysely';
import pg from 'pg';

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
  private pool: pg.Pool | null = null;
  private migrator: Migrator | null = null;
  private db: Kysely<KyselyChainStateDatabase> | null = null;
  constructor(
    private readonly connection: KyselyConnection,
    private readonly logger: LoggerPort
  ) {}

  async getVehicles(
    paginationParameters: PaginationParameters,
    allowedUserIds?: string[],
    allowedClientsIds?: string[]
  ): Promise<PaginatedVehicles> {
    //TODO: refacto with function that return query filters
    let countRequest = this.db!.selectFrom('vehicle').select(
      this.db!.fn.countAll<number>().as('count')
    );
    if (allowedUserIds) {
      countRequest = countRequest.where(({ eb, exists }) =>
        exists(
          eb
            .selectFrom('vehicle_user')
            .whereRef('vehicle.id', '=', 'vehicle_user.vehicle_id')
            .where('vehicle_user.user_id', 'in', allowedUserIds)
        )
      );
    }
    if (allowedClientsIds) {
      countRequest = countRequest.where(({ eb, exists }) =>
        exists(
          eb
            .selectFrom('vehicle_attached_client_id_item')
            .whereRef('vehicle.id', '=', 'vehicle_attached_client_id_item.vehicle_id')
            .where('vehicle_attached_client_id_item.client_id', 'in', allowedClientsIds)
        )
      );
    }
    const { count } = await countRequest.executeTakeFirstOrThrow();
    let vinsRequest = this.db!.selectFrom('vehicle')
      .select('vehicle.vin')
      .limit(paginationParameters.perPage)
      .offset((paginationParameters.page - 1) * paginationParameters.perPage);
    if (allowedUserIds) {
      vinsRequest = vinsRequest.where(({ eb, exists }) =>
        exists(
          eb
            .selectFrom('vehicle_user')
            .whereRef('vehicle.id', '=', 'vehicle_user.vehicle_id')
            .where('vehicle_user.user_id', 'in', allowedUserIds)
        )
      );
    }
    if (allowedClientsIds) {
      vinsRequest = vinsRequest.where(({ eb, exists }) =>
        exists(
          eb
            .selectFrom('vehicle_attached_client_id_item')
            .whereRef('vehicle.id', '=', 'vehicle_attached_client_id_item.vehicle_id')
            .where('vehicle_attached_client_id_item.client_id', 'in', allowedClientsIds)
        )
      );
    }
    const vins = await vinsRequest.execute();
    if (!vins) {
      return {
        items: [],
        meta: {
          page: paginationParameters.page,
          perPage: paginationParameters.perPage,
          total: 0,
        },
      };
    }
    const mappedVehicles = await Promise.all(
      vins.map((item) => this.mapInternalVehicleToVehicle(item.vin))
    );
    const meta: Pagination = {
      page: paginationParameters.page,
      perPage: paginationParameters.perPage,
      total: Number(count),
    };
    return {
      items: mappedVehicles.filter((item) => item !== null),
      meta,
    };
  }
  async getVehicleByVin(vin: string): Promise<VehicleWithUserId | null> {
    return this.mapInternalVehicleToVehicle(vin);
  }
  async getVehicleByLicensePlate(lciensePlate: string): Promise<VehicleWithUserId | null> {
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
  async saveVehicle(vehicle: VehicleWithUserId): Promise<boolean> {
    const insertedVehicleResult = await this.db
      ?.insertInto('vehicle')
      .values({ vin: vehicle.vin })
      .returning('id')
      .executeTakeFirst();
    if (!insertedVehicleResult || !insertedVehicleResult.id) {
      return false;
    }

    const vehicleId = insertedVehicleResult.id;
    await this.db
      ?.insertInto('vehicle_user')
      .values({
        vehicle_id: vehicleId,
        user_id: vehicle.userId,
      })
      .onConflict((oc) => oc.columns(['vehicle_id', 'user_id']).doNothing())
      .execute();

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
      .returning('id')
      .executeTakeFirst();
    if (!insertedVehicleFeaturesResult || !insertedVehicleFeaturesResult.id) {
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
      .returning('id')
      .executeTakeFirst();
    if (!insertedVehicleInfosResult || !insertedVehicleInfosResult.id) {
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
        .returning('id')
        .executeTakeFirst();
      if (!insertedVehicleHistoryItemResult || !insertedVehicleHistoryItemResult.id) {
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
            file_url: item.fileUrl,
            nature: item.nature,
            km: item.km,
          }))
        )
        .returning('id')
        .executeTakeFirst();
      if (
        !insertedVehicleTechnicalControlItemResult ||
        !insertedVehicleTechnicalControlItemResult.id
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
      .returning('id')
      .executeTakeFirst();
    if (!insertedVehicleSinisterInfosResult || !insertedVehicleSinisterInfosResult.id) {
      return false;
    }
    if (vehicle.attachedClientsIds.length > 0) {
      const insertedVehicleAttachedClientIdItemResult = await this.db
        ?.insertInto('vehicle_attached_client_id_item')
        .values(
          vehicle.attachedClientsIds.map((item) => ({
            client_id: item,
            vehicle_id: Number(vehicleId),
          }))
        )
        .returning('id')
        .executeTakeFirst();
      if (
        !insertedVehicleAttachedClientIdItemResult ||
        !insertedVehicleAttachedClientIdItemResult.id
      ) {
        return false;
      }
    }
    return true;
  }
  async updateVehicleByVin(
    vin: string,
    changes: UpdateVehicleTransactionChanges,
    userId: string
  ): Promise<boolean> {
    const vehicle = await this.db
      ?.selectFrom('vehicle')
      .where('vehicle.vin', '=', vin)
      .select('id')
      .executeTakeFirst();
    if (!vehicle) {
      return false;
    }
    await this.db
      ?.insertInto('vehicle_user')
      .values({
        vehicle_id: vehicle.id,
        user_id: userId,
      })
      .onConflict((oc) => oc.columns(['vehicle_id', 'user_id']).doNothing())
      .execute();
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
        .returning('id')
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
            file_url: item.fileUrl,
            nature: item.nature,
            km: item.km,
          }))
        )
        .returning('id')
        .executeTakeFirst();
      if (!updatedVehicleTechnicalControlItemResult) {
        return false;
      }
    }
    if (changes.attachedClientsIds) {
      const deletePreviousAttachedClientIdItemsResult = await this.db
        ?.deleteFrom('vehicle_attached_client_id_item')
        .where('vehicle_attached_client_id_item.vehicle_id', '=', vehicle.id)
        .executeTakeFirst();
      if (!deletePreviousAttachedClientIdItemsResult) {
        return false;
      }
      if (changes.attachedClientsIds.length === 0) {
        return true;
      }
      const updatedVehicleAttachedClientIdItemResult = await this.db
        ?.insertInto('vehicle_attached_client_id_item')
        .values(
          changes.attachedClientsIds.map((item) => ({
            vehicle_id: Number(vehicle.id),
            client_id: item,
          }))
        )
        .returning('id')
        .executeTakeFirst();
      if (!updatedVehicleAttachedClientIdItemResult) {
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
    return !this.pool.ended;
  }
  async reset(): Promise<boolean> {
    if (this.db) {
      await Promise.all([
        this.db.deleteFrom('vehicle_sinister_infos').execute(),
        this.db.deleteFrom('vehicle_technical_control_item').execute(),
        this.db.deleteFrom('vehicle_attached_client_id_item').execute(),
        this.db.deleteFrom('vehicle_history_item').execute(),
        this.db.deleteFrom('vehicle_infos').execute(),
        this.db.deleteFrom('vehicle_features').execute(),
        this.db.deleteFrom('vehicle_user').execute(),
        this.db.deleteFrom('vehicle').execute(),
      ]);
      return true;
    }
    return false;
  }

  async initialize(): Promise<void> {
    const pool = new pg.Pool({
      database: this.connection.database,
      host: this.connection.host,
      port: this.connection.port,
      user: this.connection.username,
      password: this.connection.password,
      max: 10,
    });

    const dialect = new PostgresDialect({
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
      allowUnorderedMigrations: true,
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
  async mapInternalVehicleToVehicle(vin: string): Promise<VehicleWithUserId | null> {
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
    const attachedClientIdItems = await this.db
      ?.selectFrom('vehicle_attached_client_id_item')
      .where('vehicle_attached_client_id_item.vehicle_id', '=', joinedVehicle.id)
      .selectAll()
      .execute();
    const lastUserId = await this.db
      ?.selectFrom('vehicle_user')
      .where('vehicle_user.vehicle_id', '=', joinedVehicle.id)
      .orderBy('vehicle_user.created_at', 'desc')
      .select('vehicle_user.user_id')
      .executeTakeFirst();
    const mappedVehicle: VehicleWithUserId = {
      vin,
      userId: lastUserId!.user_id,
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
        fileUrl: item.file_url,
      })),
      attachedClientsIds: (attachedClientIdItems || []).map((item) => item.client_id),
      sinisterInfos: {
        count: joinedVehicle.count,
        lastResolutionDate: joinedVehicle.last_resolution_date,
        lastSinisterDate: joinedVehicle.last_sinister_date,
      },
    };
    return mappedVehicle;
  }
}
