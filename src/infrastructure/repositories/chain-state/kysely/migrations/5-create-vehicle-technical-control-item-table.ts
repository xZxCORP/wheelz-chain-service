import { Kysely, sql } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema
    .createTable('vehicle_technical_control_item')
    .addColumn('id', 'integer', (col) => col.primaryKey().autoIncrement())
    .addColumn('vehicle_id', 'integer', (col) =>
      col.references('vehicle.id').onDelete('cascade').notNull()
    )
    .addColumn('date', 'varchar(255)', (col) => col.notNull())
    .addColumn('result', 'varchar(255)', (col) => col.notNull())
    .addColumn('result_raw', 'varchar(255)', (col) => col.notNull())
    .addColumn('nature', 'varchar(255)', (col) => col.notNull())
    .addColumn('km', 'integer', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`CURRENT_TIMESTAMP`).notNull())
    .execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema.dropTable('vehicle_technical_control_item').execute();
}
