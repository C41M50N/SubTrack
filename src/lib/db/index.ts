import { drizzle } from 'drizzle-orm/node-postgres';
import { ENV } from 'varlock/env';

export const db = drizzle(ENV.DATABASE_URL);
