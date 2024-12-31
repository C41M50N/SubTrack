import { env } from "@/env.mjs";
import { createAuthClient } from "better-auth/react";

const BASE_URL =
  process.env.NODE_ENV === "production"
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";

export const authClient = createAuthClient({
	baseURL: BASE_URL,
});

export const { signIn, signOut, signUp, useSession } = authClient;
