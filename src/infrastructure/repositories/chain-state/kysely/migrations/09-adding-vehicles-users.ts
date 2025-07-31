import { type Kysely, sql } from 'kysely';

export async function up(database: Kysely<any>): Promise<void> {
  await database.schema
    .createTable('vehicle_user')
    .addColumn('vehicle_id', 'integer', (col) =>
      col.references('vehicle.id').onDelete('cascade').notNull()
    )
    .addColumn('user_id', 'text', (col) => col.notNull())
    .addColumn('created_at', 'timestamp', (col) => col.defaultTo(sql`now()`).notNull())
    .addPrimaryKeyConstraint('vehicle_users_pkey', ['vehicle_id', 'user_id'])
    .execute();

  await database.schema.alterTable('vehicle').dropColumn('user_id').execute();
}

export async function down(database: Kysely<any>): Promise<void> {
  await database.schema.alterTable('vehicle').addColumn('user_id', 'text').execute();

  await database.schema.dropTable('vehicle_user').execute();
}
