import type { Vehicle } from '@zcorp/shared-typing-wheelz';
import { Kysely, MysqlDialect } from 'kysely';
import { createPool, type Pool } from 'mysql2';

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
  private connection: KyselyConnection;
  private pool: Pool | null = null;
  private db: Kysely<KyselyChainStateDatabase> | null = null;
  constructor(connection: KyselyConnection) {
    this.connection = connection;
  }

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
    return true;
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
  }
  async dispose(): Promise<void> {
    if (this.db) {
      this.db.destroy();
      this.db = null;
      this.pool = null;
    }
    return;
  }
}
