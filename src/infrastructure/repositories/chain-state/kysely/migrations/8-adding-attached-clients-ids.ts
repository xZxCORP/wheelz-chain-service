import { Kysely, sql } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema
    .createTable('vehicle_attached_client_id_item')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('vehicle_id', 'integer', (col) =>
      col.references('vehicle.id').onDelete('cascade').notNull()
    )
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema.dropTable('vehicle_attached_client_id_item').execute();
}
