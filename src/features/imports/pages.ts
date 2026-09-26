import type { SmartImportMediaType } from '@/features/imports/files';

export class UnreadableFileError extends Error {}

/**
 * Counts pages the way smart import limits them: each image is one page and a
 * PDF counts its real page count. PDF.js is loaded on first use so it stays out
 * of the main client bundle.
 */
export async function countPages(input: {
  name: string;
  mediaType: SmartImportMediaType;
  bytes: Uint8Array;
}): Promise<number> {
  if (input.mediaType !== 'application/pdf') {
    return 1;
  }

  const { getDocumentProxy } = await import('unpdf');
  let document: Awaited<ReturnType<typeof getDocumentProxy>>;

  try {
    // PDF.js may take ownership of the buffer it's given, so pass a copy.
    document = await getDocumentProxy(input.bytes.slice(), { verbosity: 0 });
  } catch (error) {
    if (error instanceof Error && error.name === 'PasswordException') {
      throw new UnreadableFileError(`${input.name} is password protected. Remove the password and try again.`);
    }

    throw new UnreadableFileError(`${input.name} couldn’t be read as a PDF.`);
  }

  try {
    return document.numPages;
  } finally {
    await document.loadingTask.destroy();
  }
}
