import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isUnprotectedRoutes = createRouteMatcher([
	"/",
	"/auth(.*)",
	"/api/clerk-webhooks(.*)",
	"/api/stripe-webhooks(.*)",
	"/api/functions(.*)",
]);

export default clerkMiddleware((auth, req) => {
	if (!isUnprotectedRoutes(req)) auth().protect();
});

export const config = {
	matcher: [
		// Skip Next.js internals and all static files, unless found in search params
		"/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
		// Always run for API routes
		"/(api|trpc)(.*)",
	],
};
