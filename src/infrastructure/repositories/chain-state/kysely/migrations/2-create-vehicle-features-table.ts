import { Kysely, sql } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema
    .createTable('vehicle_features')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('vehicle_id', 'integer', (col) =>
      col.references('vehicle.id').onDelete('cascade').notNull()
    )
    .addColumn('brand', 'varchar(255)', (col) => col.notNull())
    .addColumn('model', 'varchar(255)', (col) => col.notNull())
    .addColumn('cv_power', 'numeric', (col) => col.notNull())
    .addColumn('color', 'varchar(255)', (col) => col.notNull())
    .addColumn('tvv', 'varchar(255)', (col) => col.notNull())
    .addColumn('cnit_number', 'varchar(255)', (col) => col.notNull())
    .addColumn('reception_type', 'varchar(255)', (col) => col.notNull())
    .addColumn('technically_admissible_ptac', 'numeric', (col) => col.notNull())
    .addColumn('ptac', 'numeric', (col) => col.notNull())
    .addColumn('ptra', 'numeric')
    .addColumn('pt_service', 'numeric', (col) => col.notNull())
    .addColumn('ptav', 'numeric', (col) => col.notNull())
    .addColumn('category', 'varchar(255)', (col) => col.notNull())
    .addColumn('gender', 'varchar(255)', (col) => col.notNull())
    .addColumn('ce_body', 'varchar(255)', (col) => col.notNull())
    .addColumn('national_body', 'varchar(255)', (col) => col.notNull())
    .addColumn('reception_number', 'varchar(255)', (col) => col.notNull())
    .addColumn('displacement', 'numeric', (col) => col.notNull())
    .addColumn('net_power', 'numeric', (col) => col.notNull())
    .addColumn('energy', 'varchar(255)', (col) => col.notNull())
    .addColumn('seating_number', 'numeric', (col) => col.notNull())
    .addColumn('standing_places_number', 'numeric')
    .addColumn('sonorous_power_level', 'numeric', (col) => col.notNull())
    .addColumn('engine_speed', 'numeric', (col) => col.notNull())
    .addColumn('co2_emission', 'numeric')
    .addColumn('pollution_code', 'varchar(255)', (col) => col.notNull())
    .addColumn('power_mass_ratio', 'numeric')
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema.dropTable('vehicle_features').execute();
}
