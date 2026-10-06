import handler, { createServerEntry } from '@tanstack/react-start/server-entry';

import { smartImport } from '@/features/imports/api';
import { SMART_IMPORT_MAX_REQUEST_BYTES } from '@/features/imports/files';

/** Body limit for every other server function. Their payloads are small JSON. */
const SERVER_FN_MAX_REQUEST_BYTES = 1024 * 1024;

// Server function URLs are the base path followed by the function ID.
const serverFnBase = smartImport.url.slice(0, smartImport.url.lastIndexOf('/') + 1);
const smartImportId = smartImport.url.slice(serverFnBase.length);

/**
 * Rejects an oversized server function request before its body is read.
 * TanStack Start buffers a multipart body in full before any middleware runs,
 * including auth, so the size has to be checked here. Node never reads past a
 * declared Content-Length, so requiring one bounds the body.
 */
function rejectOversizedBody(request: Request): Response | null {
  const { pathname } = new URL(request.url);

  if (request.method !== 'POST' || !pathname.startsWith(serverFnBase)) {
    return null;
  }

  // TanStack Start routes on the first path segment after the base, so match
  // the same way rather than on the whole path.
  const serverFnId = pathname.slice(serverFnBase.length).split('/')[0];
  const limit = serverFnId === smartImportId ? SMART_IMPORT_MAX_REQUEST_BYTES : SERVER_FN_MAX_REQUEST_BYTES;
  const contentLength = request.headers.get('content-length');

  if (contentLength === null) {
    return new Response('Length Required', { status: 411 });
  }

  const bytes = Number(contentLength);

  if (!Number.isSafeInteger(bytes) || bytes < 0) {
    return new Response('Bad Request', { status: 400 });
  }

  if (bytes > limit) {
    return new Response('Payload Too Large', { status: 413 });
  }

  return null;
}

export default createServerEntry({
  async fetch(request, opts) {
    return rejectOversizedBody(request) ?? handler.fetch(request, opts);
  },
});
