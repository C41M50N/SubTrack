import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { ENV } from 'varlock/env';

import { db } from '@/lib/db';
import * as authSchema from '@/lib/db/auth-schema';

export const auth = betterAuth({
  secret: ENV.BETTER_AUTH_SECRET,
  baseUrl: ENV.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: authSchema,
  }),
  socialProviders: {
    google: {
      clientId: ENV.GOOGLE_CLIENT_ID,
      clientSecret: ENV.GOOGLE_CLIENT_SECRET,
    },
  },
  plugins: [tanstackStartCookies()], // make sure this is the last plugin in the array
});
