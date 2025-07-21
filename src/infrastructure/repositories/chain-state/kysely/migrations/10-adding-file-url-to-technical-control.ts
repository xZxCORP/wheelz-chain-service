import { Kysely } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema
    .alterTable('vehicle_technical_control_item')
    .addColumn('file_url', 'varchar(255)')
    .execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema
    .alterTable('vehicle_technical_control_item')
    .dropColumn('file_url')
    .execute();
}
