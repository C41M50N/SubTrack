import { env } from "@/env.mjs";
import { createAuthClient } from "better-auth/react";

export function getBaseUrl() {
  return process.env.VERCEL_ENV === "production"
    ? "https://www.subtrack.cbuff.dev"
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";
}

export const authClient = createAuthClient({
	baseURL: window.location.origin,
});

export const { signIn, signOut, signUp, useSession } = authClient;
