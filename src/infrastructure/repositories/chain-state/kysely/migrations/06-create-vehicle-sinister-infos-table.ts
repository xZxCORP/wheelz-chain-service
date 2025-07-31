import { Kysely, sql } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema
    .createTable('vehicle_sinister_infos')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('vehicle_id', 'integer', (col) =>
      col.references('vehicle.id').onDelete('cascade').notNull()
    )
    .addColumn('count', 'numeric', (col) => col.notNull())
    .addColumn('last_resolution_date', 'varchar(255)')
    .addColumn('last_sinister_date', 'varchar(255)')

    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema.dropTable('vehicle_sinister_infos').execute();
}
