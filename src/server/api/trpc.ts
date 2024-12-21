/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */

import type { GetServerSidePropsContext } from "next";
import { fromNodeHeaders } from "better-auth/node";
import { TRPCError, type inferAsyncReturnType, initTRPC } from "@trpc/server";
import type { CreateNextContextOptions } from "@trpc/server/adapters/next";
import superjson from "superjson";
import { ZodError } from "zod";

import { prisma } from "@/server/db";
import { auth } from "../auth";
import type { PrismaClient, User } from "@prisma/client";
import type { Session } from "better-auth/types";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 *
 * These allow you to access things when processing a request, like the database, the session, etc.
 */

export type AuthenticatedSession = {
	user: User;
	session: Session;
}

interface CreateContextOptions {
	req: CreateNextContextOptions["req"] | GetServerSidePropsContext["req"];
	session: AuthenticatedSession | null;
}

function createInnerTRPCContext(opts: CreateContextOptions) {
	return {
		...opts,
		db: prisma,
	}
}

export async function getServerAuthSession(
	req: CreateNextContextOptions["req"] | GetServerSidePropsContext["req"]
): Promise<AuthenticatedSession | null> {
	const session = await auth.api.getSession({
		headers: fromNodeHeaders(req.headers)
	});

	if (!session || !session.user) {
		return null;
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
	});

	if (!user) {
		return null;
	}

	return {
		session: session.session,
		user: user
	}
}

export type AuthenticatedContext = {
	session: AuthenticatedSession;
	db: PrismaClient;
}

export type UnauthenticatedContext = {
	session: null;
	db: PrismaClient;
}

export async function createTRPCContext(
	opts: CreateNextContextOptions
): Promise<AuthenticatedContext | UnauthenticatedContext> {
	const session = await getServerAuthSession(opts.req);
	return createInnerTRPCContext({
		req: opts.req,
		session: session
	});
};

export type Context = inferAsyncReturnType<typeof createTRPCContext>;

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer. We also parse
 * ZodErrors so that you get typesafety on the frontend if your procedure fails due to validation
 * errors on the backend.
 */

const t = initTRPC.context<Context>().create({
	transformer: superjson,
	errorFormatter({ shape, error }) {
		return {
			...shape,
			data: {
				...shape.data,
				zodError:
					error.cause instanceof ZodError ? error.cause.flatten() : null,
			},
		};
	},
});

/**
 * Create a server-side caller.
 *
 * @see https://trpc.io/docs/server/server-side-calls
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

const isAuthed = t.middleware(async ({ next, ctx }) => {
	if (!ctx.session || !ctx.session.user) {
		throw new TRPCError({ code: "UNAUTHORIZED" });
	}

	if (!ctx.session.user) throw new TRPCError({ code: "BAD_REQUEST" })

	return next({
		ctx: ctx
	});
});

export const createTRPCRouter = t.router;

export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(isAuthed);
