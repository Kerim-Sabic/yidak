import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

const currentDir = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(currentDir, '..', '..');

loadEnv({ path: resolve(rootDir, '.env.local') });
loadEnv({ path: resolve(rootDir, '.env') });
loadEnv({ path: resolve(currentDir, '.env.local') });
loadEnv({ path: resolve(currentDir, '.env') });

const command = process.argv.join(' ');
const needsDatabaseUrl = /(migrate|push|studio)/.test(command);

const databaseUrl = process.env.SUPABASE_DB_URL;
if (needsDatabaseUrl && !databaseUrl) {
  throw new Error('SUPABASE_DB_URL is required for Drizzle config.');
}

const fallbackDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/postgres';

export default defineConfig({
  schema: './src/schema/index.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl ?? fallbackDatabaseUrl,
  },
});
