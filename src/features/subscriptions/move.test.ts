import { describe, expect, it } from 'vitest';

import { buildMoveUndoPayload, isMoveUnchanged } from '@/features/subscriptions/move';

const before = [
  { id: 'netflix', collectionId: 'work', categoryId: 'work-streaming' },
  { id: 'hulu', collectionId: 'work', categoryId: 'work-streaming' },
  { id: 'notion', collectionId: 'side', categoryId: null },
];

const after = [
  { id: 'notion', collectionId: 'personal', categoryId: null },
  { id: 'netflix', collectionId: 'personal', categoryId: 'personal-streaming' },
  { id: 'hulu', collectionId: 'personal', categoryId: 'personal-streaming' },
];

const payload = buildMoveUndoPayload({
  targetCollectionId: 'personal',
  before,
  after,
  createdCategoryIds: ['personal-streaming'],
});

describe('buildMoveUndoPayload', () => {
  it('records each subscription’s previous and moved placement', () => {
    expect(payload).toEqual({
      targetCollectionId: 'personal',
      items: [
        {
          subscriptionId: 'netflix',
          previousCollectionId: 'work',
          previousCategoryId: 'work-streaming',
          movedCategoryId: 'personal-streaming',
        },
        {
          subscriptionId: 'hulu',
          previousCollectionId: 'work',
          previousCategoryId: 'work-streaming',
          movedCategoryId: 'personal-streaming',
        },
        {
          subscriptionId: 'notion',
          previousCollectionId: 'side',
          previousCategoryId: null,
          movedCategoryId: null,
        },
      ],
      createdCategoryIds: ['personal-streaming'],
    });
  });

  it('does not share the created category list with the caller', () => {
    const createdCategoryIds = ['personal-streaming'];
    const result = buildMoveUndoPayload({ targetCollectionId: 'personal', before, after, createdCategoryIds });

    createdCategoryIds.push('other');

    expect(result.createdCategoryIds).toEqual(['personal-streaming']);
  });

  it('throws when a subscription is missing from the moved state', () => {
    expect(() =>
      buildMoveUndoPayload({
        targetCollectionId: 'personal',
        before,
        after: after.slice(1),
        createdCategoryIds: [],
      }),
    ).toThrow();
  });

  it('throws when a subscription did not land in the target collection', () => {
    expect(() =>
      buildMoveUndoPayload({
        targetCollectionId: 'personal',
        before,
        after: after.map((subscription) => ({ ...subscription, collectionId: 'work' })),
        createdCategoryIds: [],
      }),
    ).toThrow();
  });
});

describe('isMoveUnchanged', () => {
  it('accepts subscriptions still where the move left them', () => {
    expect(isMoveUnchanged(payload, after)).toBe(true);
  });

  it('rejects a subscription that moved to another collection', () => {
    const current = after.map((subscription) =>
      subscription.id === 'hulu' ? { ...subscription, collectionId: 'work' } : subscription,
    );

    expect(isMoveUnchanged(payload, current)).toBe(false);
  });

  it('rejects a subscription whose category changed', () => {
    const current = after.map((subscription) =>
      subscription.id === 'netflix' ? { ...subscription, categoryId: null } : subscription,
    );

    expect(isMoveUnchanged(payload, current)).toBe(false);
  });

  it('compares uncategorized subscriptions null-safely', () => {
    const current = after.map((subscription) =>
      subscription.id === 'notion' ? { ...subscription, categoryId: 'personal-streaming' } : subscription,
    );

    expect(isMoveUnchanged(payload, current)).toBe(false);
  });

  it('rejects a missing subscription', () => {
    expect(isMoveUnchanged(payload, after.slice(1))).toBe(false);
  });

  it('rejects subscriptions the move did not include', () => {
    const current = [...after.slice(1), { id: 'spotify', collectionId: 'personal', categoryId: null }];

    expect(isMoveUnchanged(payload, current)).toBe(false);
  });
});
