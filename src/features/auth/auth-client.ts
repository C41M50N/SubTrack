import { env } from "@/env.mjs";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_SITE_URL
		? `https://${process.env.NEXT_PUBLIC_SITE_URL}`
		: "http://localhost:3000",
});

export const { signIn, signOut, signUp, useSession } = authClient;
