import { z } from "zod";

export const PasswordSchema = z
  .string()
  .min(8, { message: "password must be at least 8 characters" })
  .max(80, { message: "password can be at most 80 characters" })
  .refine((password) => /[A-Z]/.test(password), {
    message: "password must include at least one uppercase letter"
  })
  .refine((password) => /[a-z]/.test(password), {
    message: "password must include at least one lowercase letter"
  })
  .refine((password) => /[0-9]/.test(password), {
    message: "password must include at least one number"
  })
  .refine((password) => /[!@#$%^&*]/.test(password), {
    message: "password must include at least one of the following special characters: ! @ # $ % ^ & *",
  });
