import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

import { requireAuthMiddleware } from '@/features/auth/middleware';
import { searchBrands } from '@/features/subscriptions/icons/server';

export const searchBrandLogos = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .validator(z.object({ query: z.string() }))
  .handler(async ({ data }) => searchBrands(data.query));
