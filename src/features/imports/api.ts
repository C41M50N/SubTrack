import { createServerFn } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';

import { requireAuthMiddleware } from '@/features/auth/middleware';
import { getMySmartImportStatus, runMySmartImport, type SmartImportResponse } from '@/features/imports/server';
import { withUserFacingErrors } from '@/lib/errors';

function parseSmartImportFormData(data: FormData) {
  if (!(data instanceof FormData)) {
    throw new Error('Expected form data');
  }

  const collectionId = data.get('collectionId');
  const files = data.getAll('files');

  if (typeof collectionId !== 'string' || collectionId === '') {
    throw new Error('Collection is required');
  }

  if (!files.every((file): file is File => file instanceof File)) {
    throw new Error('Expected files');
  }

  return { collectionId, files };
}

export const getSmartImportStatus = createServerFn({ method: 'GET' })
  .middleware([requireAuthMiddleware])
  .handler(async ({ context: { auth } }) => getMySmartImportStatus(auth.userId));

// The server entry rejects oversized bodies before this function parses them.
// Expected failures come back as a result rather than a thrown error, so the
// client can tell this function's messages apart from a proxy's error page.
export const smartImport = createServerFn({ method: 'POST' })
  .middleware([requireAuthMiddleware])
  .validator(parseSmartImportFormData)
  .handler(async ({ context: { auth }, data }): Promise<SmartImportResponse> => {
    // Aborts when the client cancels or disconnects, which cancels the run.
    const { signal } = getRequest();

    try {
      const { candidates } = await withUserFacingErrors('Smart import failed. Try again.', () =>
        runMySmartImport({
          userId: auth.userId,
          collectionId: data.collectionId,
          files: data.files,
          abortSignal: signal,
        }),
      );

      return { status: 'succeeded', candidates };
    } catch (error) {
      return { status: 'failed', message: error instanceof Error ? error.message : 'Smart import failed. Try again.' };
    }
  });
