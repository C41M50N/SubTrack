import { z } from 'zod';

export const AccountDetailsSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'name must be at least 2 characters' })
    .max(100, { message: 'name can be at most 100 characters' }),
});
