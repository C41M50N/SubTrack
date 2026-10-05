import { createFileRoute } from '@tanstack/react-router';

import { db } from '@/lib/db';

export const Route = createFileRoute('/api/health')({
  server: {
    handlers: {
      GET: async () => {
        try {
          const query = { text: 'SELECT 1', query_timeout: 5000 };
          await db.$client.query(query);
          return new Response('OK', { headers: { 'Cache-Control': 'no-store' } });
        } catch {
          return new Response('Unavailable', { status: 503, headers: { 'Cache-Control': 'no-store' } });
        }
      },
    },
  },
});
