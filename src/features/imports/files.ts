/**
 * Upload rules shared by the dialog and the smart import server function.
 * The client checks them for immediate feedback; the server checks them again.
 */

const MB = 1024 * 1024;

export const EXPORT_FILE_MAX_BYTES = 5 * MB;

export const SMART_IMPORT_MAX_FILES = 5;
export const SMART_IMPORT_MAX_FILE_BYTES = 10 * MB;
export const SMART_IMPORT_MAX_PAGES = 20;

/**
 * Largest smart import request body the server reads. Multipart framing and
 * the collection ID fit comfortably in the extra megabyte.
 */
export const SMART_IMPORT_MAX_REQUEST_BYTES = SMART_IMPORT_MAX_FILES * SMART_IMPORT_MAX_FILE_BYTES + MB;

export type ExportFileFormat = 'json' | 'csv';

export type SmartImportMediaType = 'application/pdf' | 'image/png' | 'image/jpeg' | 'image/webp';

export const EXPORT_FILE_ACCEPT = '.json,.csv,application/json,text/csv';
export const SMART_IMPORT_FILE_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp';

export const HEIC_NOT_SUPPORTED_MESSAGE = 'HEIC isn’t supported. Export the image as JPEG or PNG.';
export const MIXED_FILES_MESSAGE = 'Export files can’t be combined with other files. Upload the export on its own.';
export const TOO_MANY_PAGES_MESSAGE = `Files can have at most ${SMART_IMPORT_MAX_PAGES} pages in total.`;

type FileLike = { name: string; type: string; size: number };

const smartImportMediaTypeByExtension: Record<string, SmartImportMediaType> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
};

const smartImportMediaTypes = new Set<string>(Object.values(smartImportMediaTypeByExtension));

function getExtension(name: string): string {
  const dot = name.lastIndexOf('.');

  return dot === -1 ? '' : name.slice(dot + 1).toLowerCase();
}

function isHeic(file: FileLike): boolean {
  const extension = getExtension(file.name);

  return extension === 'heic' || extension === 'heif' || /^image\/hei[cf]/.test(file.type);
}

/** The export format of a file, judged by its extension. */
export function getExportFileFormat(file: FileLike): ExportFileFormat | null {
  const extension = getExtension(file.name);

  return extension === 'json' || extension === 'csv' ? extension : null;
}

/** The media type sent to the model, from the declared type or the extension. */
export function getSmartImportMediaType(file: FileLike): SmartImportMediaType | null {
  if (smartImportMediaTypes.has(file.type)) {
    return file.type as SmartImportMediaType;
  }

  return smartImportMediaTypeByExtension[getExtension(file.name)] ?? null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < MB) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${(bytes / MB).toFixed(1)} MB`;
}

export type FileSelection<TFile extends FileLike> =
  | { path: 'file'; file: TFile; format: ExportFileFormat }
  | { path: 'smart'; files: TFile[] }
  | { path: 'invalid'; message: string };

/**
 * Decides which import path a selection takes. Page counts need the file
 * contents, so they're checked separately with `countPages`.
 */
export function classifyFileSelection<TFile extends FileLike>(files: TFile[]): FileSelection<TFile> {
  if (files.length === 0) {
    return { path: 'invalid', message: 'Choose a file to import.' };
  }

  if (files.some(isHeic)) {
    return { path: 'invalid', message: HEIC_NOT_SUPPORTED_MESSAGE };
  }

  const exportFiles = files.filter((file) => getExportFileFormat(file) !== null);

  if (exportFiles.length > 0) {
    if (exportFiles.length < files.length) {
      return { path: 'invalid', message: MIXED_FILES_MESSAGE };
    }

    const [file] = exportFiles;

    if (exportFiles.length > 1 || !file) {
      return { path: 'invalid', message: 'Import one export file at a time.' };
    }

    if (file.size > EXPORT_FILE_MAX_BYTES) {
      return { path: 'invalid', message: `${file.name} is larger than ${formatFileSize(EXPORT_FILE_MAX_BYTES)}.` };
    }

    return { path: 'file', file, format: getExportFileFormat(file) ?? 'json' };
  }

  const unsupported = files.find((file) => getSmartImportMediaType(file) === null);

  if (unsupported) {
    return {
      path: 'invalid',
      message: `${unsupported.name} isn’t supported. Upload a JSON or CSV export, or PDFs and images.`,
    };
  }

  if (files.length > SMART_IMPORT_MAX_FILES) {
    return { path: 'invalid', message: `Upload up to ${SMART_IMPORT_MAX_FILES} files at a time.` };
  }

  const oversized = files.find((file) => file.size > SMART_IMPORT_MAX_FILE_BYTES);

  if (oversized) {
    return {
      path: 'invalid',
      message: `${oversized.name} is larger than ${formatFileSize(SMART_IMPORT_MAX_FILE_BYTES)}.`,
    };
  }

  const empty = files.find((file) => file.size === 0);

  if (empty) {
    return { path: 'invalid', message: `${empty.name} is empty.` };
  }

  return { path: 'smart', files };
}

function startsWith(bytes: Uint8Array, signature: number[], offset = 0): boolean {
  return signature.every((byte, index) => bytes[offset + index] === byte);
}

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46, 0x2d]; // %PDF-

/**
 * Detects a smart import file's type from its contents. The server trusts this
 * rather than the declared type or extension.
 */
export function detectSmartImportMediaType(bytes: Uint8Array): SmartImportMediaType | null {
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'image/png';
  }

  if (startsWith(bytes, [0xff, 0xd8, 0xff])) {
    return 'image/jpeg';
  }

  if (startsWith(bytes, [0x52, 0x49, 0x46, 0x46]) && startsWith(bytes, [0x57, 0x45, 0x42, 0x50], 8)) {
    return 'image/webp';
  }

  // PDF readers accept a header anywhere in the first kilobyte.
  const head = bytes.subarray(0, 1024);

  for (let index = 0; index <= head.length - PDF_SIGNATURE.length; index += 1) {
    if (startsWith(head, PDF_SIGNATURE, index)) {
      return 'application/pdf';
    }
  }

  return null;
}
