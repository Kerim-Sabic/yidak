import 'dotenv/config';

import { migrate } from 'drizzle-orm/postgres-js/migrator';

import { db, sql } from './client';

export const runMigrations = async (): Promise<void> => {
  await migrate(db, { migrationsFolder: './drizzle' });
  await sql.end();
};

await runMigrations();
