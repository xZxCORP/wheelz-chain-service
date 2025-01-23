import { Kysely, sql } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema
    .createTable('vehicle_technical_control_item')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('vehicle_id', 'integer', (col) =>
      col.references('vehicle.id').onDelete('cascade').notNull()
    )
    .addColumn('date', 'varchar(255)', (col) => col.notNull())
    .addColumn('result', 'varchar(255)', (col) => col.notNull())
    .addColumn('result_raw', 'varchar(255)', (col) => col.notNull())
    .addColumn('nature', 'varchar(255)', (col) => col.notNull())
    .addColumn('km', 'numeric', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema.dropTable('vehicle_technical_control_item').execute();
}
