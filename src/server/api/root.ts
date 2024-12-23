import { categoriesRouter } from "@/server/api/routers/categories";
import { collectionsRouter } from "@/server/api/routers/collections";
import { mainRouter } from "@/server/api/routers/main";
import { subscriptionsRouter } from "@/server/api/routers/subscriptions";
import { createCallerFactory, createTRPCRouter } from "@/server/api/trpc";
import { dataRouter } from "./routers/data";
import { usersRouter } from "./routers/users";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	main: mainRouter,
	users: usersRouter,
	categories: categoriesRouter,
	collections: collectionsRouter,
	subscriptions: subscriptionsRouter,
	data: dataRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
