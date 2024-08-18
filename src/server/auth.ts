import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { GetServerSidePropsContext } from "next";
import {
	type DefaultSession,
	type NextAuthOptions,
	getServerSession,
} from "next-auth";
import GoogleProvider from "next-auth/providers/google";

import { env } from "@/env.mjs";
import { prisma } from "@/server/db";
import type { LicenseType } from "@prisma/client";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: DefaultSession["user"] & {
			id: string;
			licenseType: LicenseType;
			todoistAPIKey: string;
			todoistProjectId: string;
			// ...other properties
			// role: UserRole;
		};
	}

	interface User {
		licenseType: LicenseType;
		todoistAPIKey: string;
		todoistProjectId: string;
		// ...other properties
		// role: UserRole;
	}
}

const adapter = PrismaAdapter(prisma);

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
	callbacks: {
		session: ({ session, user }) => ({
			...session,
			user: {
				...session.user,
				id: user.id,
				todoistAPIKey: user.todoistAPIKey,
				todoistProjectId: user.todoistProjectId,
			},
		}),
	},
	adapter: {
		...adapter,
		async createUser(user) {
			if (!adapter.createUser) {
				throw new Error("default prisma adapter failure");
			}

			const u = await adapter.createUser(user);
			await prisma.collection.create({
				data: {
					title: "Personal",
					userId: u.id,
				},
			});
			return u;
		},
	},
	providers: [
		GoogleProvider({
			clientId: env.GOOGLE_CLIENT_ID,
			clientSecret: env.GOOGLE_CLIENT_SECRET,
		}),
	],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
	req: GetServerSidePropsContext["req"];
	res: GetServerSidePropsContext["res"];
}) => {
	return getServerSession(ctx.req, ctx.res, authOptions);
};
