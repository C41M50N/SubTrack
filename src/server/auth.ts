import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { env } from '@/env.mjs';
import initializeUserData from '@/features/users/actions/initialize-user-data';
import { prisma } from './db';

export const auth = betterAuth({
  socialProviders: {
    google: {
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET,
      mapProfileToUser: (profile) => {
        return {
          name: `${profile.given_name} ${profile.family_name}`,
          image: profile.picture,
        };
      },
    },
  },

  database: prismaAdapter(prisma, { provider: 'postgresql' }),
  databaseHooks: {
    user: {
      create: {
        async after(user) {
          await initializeUserData({ userId: user.id });
        },
      },
    },
  },

  user: { modelName: 'User' },
  session: {
    modelName: 'Session',
    expiresIn: 60 * 60 * 24 * 14, // 14 days
    updateAge: 60 * 60 * 24, // 1 day (every 1 day the session expiration is updated)
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 minutes
    },
  },
  account: { modelName: 'Account' },
  verification: { modelName: 'Verification' },
});
