import { createFileRoute } from '@tanstack/react-router';

import { getResendWebhookSecret } from '@/features/notifications/resend';
import { handleResendEvent } from '@/features/notifications/resend-events';
import { verifySignature } from '@/features/notifications/signing';

/** Resend delivery events are small; anything larger isn't one. */
const MAX_BODY_BYTES = 256 * 1024;

async function handleResendWebhook(request: Request): Promise<Response> {
  const secret = getResendWebhookSecret();

  if (!secret) {
    return new Response('Not configured', { status: 503 });
  }

  const declaredLength = Number(request.headers.get('content-length') ?? 0);

  if (declaredLength > MAX_BODY_BYTES) {
    return new Response('Payload Too Large', { status: 413 });
  }

  // The signature covers the exact bytes Resend sent, so verify the raw body
  // before parsing it.
  const body = await request.text();

  if (body.length > MAX_BODY_BYTES) {
    return new Response('Payload Too Large', { status: 413 });
  }

  const messageId = request.headers.get('svix-id');
  const check = verifySignature({
    id: messageId,
    timestamp: request.headers.get('svix-timestamp'),
    signatureHeader: request.headers.get('svix-signature'),
    body,
    secret,
  });

  if (!check.ok || !messageId) {
    return new Response('Invalid signature', { status: 401 });
  }

  let event: unknown;

  try {
    event = JSON.parse(body);
  } catch {
    return new Response('Invalid payload', { status: 400 });
  }

  if (typeof event !== 'object' || event === null || !('type' in event) || typeof event.type !== 'string') {
    return new Response('Invalid payload', { status: 400 });
  }

  const outcome = await handleResendEvent(messageId, event as Parameters<typeof handleResendEvent>[1]);

  // Any non-2xx makes Resend retry, which covers an event that arrived
  // before its email's ID was saved.
  return outcome === 'redeliver'
    ? new Response('Email not recorded yet', { status: 409 })
    : new Response(null, { status: 204 });
}

export const Route = createFileRoute('/api/webhooks/resend')({
  server: {
    handlers: {
      POST: async ({ request }: { request: Request }) => handleResendWebhook(request),
    },
  },
});
