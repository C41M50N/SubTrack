import { categoriesRouter } from "@/server/api/routers/categories";
import { collectionsRouter } from "@/server/api/routers/collections";
import { mainRouter } from "@/server/api/routers/main";
import { subscriptionsRouter } from "@/server/api/routers/subscriptions";
import { createTRPCRouter, createCallerFactory } from "@/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	main: mainRouter,
	categories: categoriesRouter,
	collections: collectionsRouter,
	subscriptions: subscriptionsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
