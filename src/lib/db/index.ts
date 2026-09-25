import { drizzle } from 'drizzle-orm/node-postgres';
import { ENV } from 'varlock/env';

export const db = drizzle(ENV.DATABASE_URL);

/** The transaction handle passed to a `db.transaction` callback. */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];
