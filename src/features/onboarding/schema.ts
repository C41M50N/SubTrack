import { z } from 'zod';

export const setUpAccountInputSchema = z.object({
  // Checked when saved; an invalid zone is skipped rather than failing setup.
  timeZone: z.string().max(100).optional(),
});
