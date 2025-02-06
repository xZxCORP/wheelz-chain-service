import { Kysely } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema.alterTable('vehicle').addColumn('user_id', 'text').execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema.alterTable('vehicle').dropColumn('user_id').execute();
}
