import type { MoveUndoPayload } from '@/features/subscriptions/schema';

/** The part of a subscription a move changes and an undo restores. */
export type SubscriptionPlacement = {
  id: string;
  collectionId: string;
  categoryId: string | null;
};

/**
 * Describes how to reverse a move: each subscription's placement before the
 * move, the category it was given, and the categories the move created.
 */
export function buildMoveUndoPayload(input: {
  targetCollectionId: string;
  before: SubscriptionPlacement[];
  after: SubscriptionPlacement[];
  createdCategoryIds: string[];
}): MoveUndoPayload {
  const afterById = new Map(input.after.map((subscription) => [subscription.id, subscription]));

  return {
    targetCollectionId: input.targetCollectionId,
    items: input.before.map((previous) => {
      const moved = afterById.get(previous.id);

      if (!moved || moved.collectionId !== input.targetCollectionId) {
        throw new Error(`Subscription ${previous.id} was not moved to the target collection`);
      }

      return {
        subscriptionId: previous.id,
        previousCollectionId: previous.collectionId,
        previousCategoryId: previous.categoryId,
        movedCategoryId: moved.categoryId,
      };
    }),
    createdCategoryIds: [...input.createdCategoryIds],
  };
}

/**
 * True when every moved subscription is still exactly where the move left it.
 * Undo is all-or-nothing, so any missing or changed subscription blocks it.
 */
export function isMoveUnchanged(payload: MoveUndoPayload, current: SubscriptionPlacement[]): boolean {
  if (current.length !== payload.items.length) {
    return false;
  }

  const currentById = new Map(current.map((subscription) => [subscription.id, subscription]));

  return payload.items.every((item) => {
    const subscription = currentById.get(item.subscriptionId);

    return (
      subscription !== undefined &&
      subscription.collectionId === payload.targetCollectionId &&
      subscription.categoryId === item.movedCategoryId
    );
  });
}
