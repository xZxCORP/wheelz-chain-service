import { Kysely, sql } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema
    .createTable('vehicle')
    .addColumn('id', 'serial', (col) => col.primaryKey())
    .addColumn('vin', 'varchar(17)', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema.dropTable('vehicle').execute();
}
