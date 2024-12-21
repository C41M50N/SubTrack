import { env } from "@/env.mjs";
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: 
    env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000",
})

export const {
  signIn,
  signOut,
  signUp,
  useSession
} = authClient;