import { Kysely, sql } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema
    .createTable('vehicle_features')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('vehicle_id', 'integer', (col) =>
      col.references('vehicle.id').onDelete('cascade').notNull()
    )
    .addColumn('brand', 'varchar(255)', (col) => col.notNull())
    .addColumn('model', 'varchar(255)', (col) => col.notNull())
    .addColumn('cv_power', 'integer', (col) => col.notNull())
    .addColumn('color', 'varchar(255)', (col) => col.notNull())
    .addColumn('tvv', 'varchar(255)', (col) => col.notNull())
    .addColumn('cnit_number', 'varchar(255)', (col) => col.notNull())
    .addColumn('reception_type', 'varchar(255)', (col) => col.notNull())
    .addColumn('technically_admissible_ptac', 'integer', (col) => col.notNull())
    .addColumn('ptac', 'integer', (col) => col.notNull())
    .addColumn('ptra', 'integer')
    .addColumn('pt_service', 'integer', (col) => col.notNull())
    .addColumn('ptav', 'integer', (col) => col.notNull())
    .addColumn('category', 'varchar(255)', (col) => col.notNull())
    .addColumn('gender', 'varchar(255)', (col) => col.notNull())
    .addColumn('ce_body', 'varchar(255)', (col) => col.notNull())
    .addColumn('national_body', 'varchar(255)', (col) => col.notNull())
    .addColumn('reception_number', 'varchar(255)', (col) => col.notNull())
    .addColumn('displacement', 'integer', (col) => col.notNull())
    .addColumn('net_power', 'integer', (col) => col.notNull())
    .addColumn('energy', 'varchar(255)', (col) => col.notNull())
    .addColumn('seating_number', 'integer', (col) => col.notNull())
    .addColumn('standing_places_number', 'integer')
    .addColumn('sonorous_power_level', 'integer', (col) => col.notNull())
    .addColumn('engine_speed', 'integer', (col) => col.notNull())
    .addColumn('co2_emission', 'integer')
    .addColumn('pollution_code', 'varchar(255)', (col) => col.notNull())
    .addColumn('power_mass_ratio', 'integer')
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema.dropTable('vehicle_features').execute();
}
