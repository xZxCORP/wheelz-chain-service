import { Kysely, sql } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema
    .createTable('vehicle_infos')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('vehicle_id', 'integer', (col) =>
      col.references('vehicle.id').onDelete('cascade').notNull()
    )
    .addColumn('holder_count', 'numeric', (col) => col.notNull())
    .addColumn('first_registration_in_france_date', 'varchar(255)', (col) => col.notNull())
    .addColumn('first_siv_registration_date', 'varchar(255)', (col) => col.notNull())
    .addColumn('license_plate', 'varchar(255)', (col) => col.notNull())
    .addColumn('siv_conversion_date', 'varchar(255)')
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema.dropTable('vehicle_infos').execute();
}
