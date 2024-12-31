import { env } from "@/env.mjs";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
	baseURL: window.location.origin,
});

export const { signIn, signOut, signUp, useSession } = authClient;
