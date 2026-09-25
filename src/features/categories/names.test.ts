import { describe, expect, it } from 'vitest';

import { dedupeCategoryNames, toCategoryNameKey } from '@/features/categories/names';

describe('toCategoryNameKey', () => {
  it('compares names case-insensitively', () => {
    expect(toCategoryNameKey('Streaming')).toBe(toCategoryNameKey('STREAMING'));
    expect(toCategoryNameKey('Streaming')).toBe('streaming');
  });

  it('keeps other characters intact', () => {
    expect(toCategoryNameKey('Health & Fitness')).toBe('health & fitness');
  });
});

describe('dedupeCategoryNames', () => {
  it('keeps the first casing seen for each name', () => {
    expect(dedupeCategoryNames(['Streaming', 'streaming', 'Music', 'STREAMING', 'music'])).toEqual([
      'Streaming',
      'Music',
    ]);
  });

  it('preserves first-seen order', () => {
    expect(dedupeCategoryNames(['Work', 'Home', 'work'])).toEqual(['Work', 'Home']);
  });

  it('returns an empty list for no names', () => {
    expect(dedupeCategoryNames([])).toEqual([]);
  });
});
