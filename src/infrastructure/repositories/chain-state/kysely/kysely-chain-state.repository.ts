import { promises as fs } from 'node:fs';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Vehicle } from '@zcorp/shared-typing-wheelz';
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

export class KyselyChainStateRepository implements ChainStateRepository, ManagedResource {
  private pool: Pool | null = null;
  private migrator: Migrator | null = null;
  private db: Kysely<KyselyChainStateDatabase> | null = null;
  constructor(
    private readonly connection: KyselyConnection,
    private readonly logger: LoggerPort
  ) {}

  async getVehicles(): Promise<Vehicle[]> {
    return [];
  }
  async getVehicleById(id: string): Promise<Vehicle | null> {
    return null;
  }
  async saveVehicle(vehicle: Vehicle): Promise<void> {
    return;
  }
  async updateVehicle(vin: string, vehicle: Partial<Vehicle>) {
    return;
  }
  async removeVehicle(id: string) {
    return;
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
      this.db.deleteFrom('vehicle_sinister_infos').execute();
      this.db.deleteFrom('vehicle_technical_control_item').execute();
      this.db.deleteFrom('vehicle_history_item').execute();
      this.db.deleteFrom('vehicle_infos').execute();
      this.db.deleteFrom('vehicle_features').execute();
      this.db.deleteFrom('vehicle').execute();
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
}
