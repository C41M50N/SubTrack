import { describe, expect, it } from 'vitest';

import {
  classifyFileSelection,
  detectSmartImportMediaType,
  HEIC_NOT_SUPPORTED_MESSAGE,
  MIXED_FILES_MESSAGE,
} from '@/features/imports/files';

const MB = 1024 * 1024;

const file = (name: string, size = 1024, type = '') => ({ name, size, type });

describe('classifyFileSelection', () => {
  it('routes one export file to file import', () => {
    expect(classifyFileSelection([file('export.json')])).toMatchObject({ path: 'file', format: 'json' });
    expect(classifyFileSelection([file('export.CSV')])).toMatchObject({ path: 'file', format: 'csv' });
  });

  it('routes PDFs and images to smart import', () => {
    const selection = classifyFileSelection([
      file('statement.pdf', MB, 'application/pdf'),
      file('receipt.png', MB, 'image/png'),
      file('screenshot.jpeg'),
      file('photo.webp', MB, 'image/webp'),
    ]);

    expect(selection).toMatchObject({ path: 'smart' });
  });

  it('rejects export files mixed with other files', () => {
    expect(classifyFileSelection([file('export.csv'), file('statement.pdf')])).toEqual({
      path: 'invalid',
      message: MIXED_FILES_MESSAGE,
    });
  });

  it('rejects more than one export file', () => {
    expect(classifyFileSelection([file('a.json'), file('b.json')])).toMatchObject({ path: 'invalid' });
  });

  it('rejects HEIC files with a specific message', () => {
    expect(classifyFileSelection([file('IMG_0001.HEIC')])).toEqual({
      path: 'invalid',
      message: HEIC_NOT_SUPPORTED_MESSAGE,
    });
    expect(classifyFileSelection([file('photo', 10, 'image/heif')])).toMatchObject({
      message: HEIC_NOT_SUPPORTED_MESSAGE,
    });
  });

  it('enforces the size and count limits', () => {
    expect(classifyFileSelection([file('export.json', 5 * MB + 1)])).toMatchObject({ path: 'invalid' });
    expect(classifyFileSelection([file('export.json', 5 * MB)])).toMatchObject({ path: 'file' });
    expect(classifyFileSelection([file('big.pdf', 10 * MB + 1)])).toMatchObject({ path: 'invalid' });
    expect(classifyFileSelection([file('big.pdf', 10 * MB)])).toMatchObject({ path: 'smart' });
    expect(classifyFileSelection(Array.from({ length: 6 }, (_, index) => file(`${index}.png`)))).toMatchObject({
      path: 'invalid',
      message: 'Upload up to 5 files at a time.',
    });
  });

  it('rejects unsupported and empty files', () => {
    expect(classifyFileSelection([file('notes.docx')])).toMatchObject({ path: 'invalid' });
    expect(classifyFileSelection([file('empty.pdf', 0)])).toMatchObject({ path: 'invalid' });
    expect(classifyFileSelection([])).toMatchObject({ path: 'invalid' });
  });
});

describe('detectSmartImportMediaType', () => {
  const bytes = (...values: number[]) => new Uint8Array(values);
  const ascii = (text: string) => new TextEncoder().encode(text);

  it('recognizes each supported format by its signature', () => {
    expect(detectSmartImportMediaType(ascii('%PDF-1.7\n'))).toBe('application/pdf');
    expect(detectSmartImportMediaType(ascii('\n\n%PDF-1.4'))).toBe('application/pdf');
    expect(detectSmartImportMediaType(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a))).toBe('image/png');
    expect(detectSmartImportMediaType(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('image/jpeg');
    expect(detectSmartImportMediaType(ascii('RIFF\0\0\0\0WEBPVP8 '))).toBe('image/webp');
  });

  it('rejects anything else', () => {
    expect(detectSmartImportMediaType(ascii('<html>'))).toBeNull();
    expect(detectSmartImportMediaType(ascii('RIFF\0\0\0\0WAVE'))).toBeNull();
  });
});
