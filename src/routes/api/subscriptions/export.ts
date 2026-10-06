import { createFileRoute } from '@tanstack/react-router';

import { auth } from '@/features/auth/server';
import { getMyCollection, listMyCollections } from '@/features/collections/server';
import {
  buildExportFilename,
  exportContentType,
  serializeSubscriptionsToCsv,
  serializeSubscriptionsToJson,
  type SubscriptionExportScope,
  toSubscriptionExportRecords,
} from '@/features/subscriptions/export';
import { exportSubscriptionsInputSchema } from '@/features/subscriptions/schema';
import { listMySubscriptions } from '@/features/subscriptions/server';

async function handleExport(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });

  if (!session) {
    return new Response('Unauthorized', { status: 401 });
  }

  const url = new URL(request.url);
  const parsedInput = exportSubscriptionsInputSchema.safeParse({
    format: url.searchParams.get('format'),
    collectionId: url.searchParams.get('collectionId') ?? undefined,
  });

  if (!parsedInput.success) {
    return new Response('Invalid export request', { status: 400 });
  }

  const userId = session.user.id;
  const { format, collectionId } = parsedInput.data;

  const collectionNameById = new Map<string, string>();
  let jsonScope: SubscriptionExportScope;
  let filenameScope: 'all' | { collectionName: string; collectionId: string };

  if (collectionId) {
    const collection = await getMyCollection(userId, collectionId);

    if (!collection) {
      return new Response('Collection not found', { status: 404 });
    }

    collectionNameById.set(collection.id, collection.name);
    jsonScope = { collection: collection.name };
    filenameScope = { collectionName: collection.name, collectionId: collection.id };
  } else {
    const collections = await listMyCollections(userId);

    for (const collection of collections) {
      collectionNameById.set(collection.id, collection.name);
    }

    jsonScope = 'all';
    filenameScope = 'all';
  }

  const subscriptions = await listMySubscriptions(userId, collectionId ? { collectionId } : undefined);
  const records = toSubscriptionExportRecords(subscriptions, collectionNameById);

  const content =
    format === 'csv' ? serializeSubscriptionsToCsv(records) : serializeSubscriptionsToJson(records, jsonScope);
  const filename = buildExportFilename({ scope: filenameScope, format });

  return new Response(content, {
    status: 200,
    headers: {
      'Content-Type': exportContentType(format),
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  });
}

export const Route = createFileRoute('/api/subscriptions/export')({
  server: {
    handlers: {
      GET: async ({ request }: { request: Request }) => handleExport(request),
    },
  },
});
