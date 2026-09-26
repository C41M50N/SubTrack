import { defineConfig } from 'drizzle-kit';
import { ENV } from 'varlock/env';

export default defineConfig({
  out: './drizzle',
  schema: './src/lib/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: ENV.DATABASE_URL,
  },
});
