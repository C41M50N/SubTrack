import { FolderInputIcon } from 'lucide-react';
import { useCallback } from 'react';
import { toast } from 'sonner';

import { MenuActionItem } from '@/components/menu-action-item';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { CollectionRecord } from '@/features/collections/queries';
import {
  useMoveSubscriptions,
  useUndoMove,
} from '@/features/subscriptions/mutations';
import type { SubscriptionRecord } from '@/features/subscriptions/queries';

const NO_MOVE_TARGETS_MESSAGE =
  'Create another collection to move subscriptions.';

export type MoveSubscriptions = (
  subscriptions: SubscriptionRecord[],
  target: CollectionRecord,
  options?: { onSuccess?: () => void },
) => void;

/**
 * Moves subscriptions immediately, then offers Undo from the success toast.
 * The Undo payload lives only in the toast action's closure.
 */
export function useMoveSubscriptionsWithUndo(sourceCollectionName: string) {
  const { mutate: moveSubscriptions, isPending } = useMoveSubscriptions();
  const { mutate: undoMove } = useUndoMove();

  const move = useCallback<MoveSubscriptions>(
    (subscriptions, target, options) => {
      const count = subscriptions.length;

      if (count === 0) {
        return;
      }

      moveSubscriptions(
        {
          subscriptionIds: subscriptions.map((subscription) => subscription.id),
          collectionId: target.id,
        },
        {
          onSuccess: (result) => {
            options?.onSuccess?.();
            toast.success(
              count === 1
                ? `Moved “${subscriptions[0]?.name}” to ${target.name}`
                : `Moved ${count} subscriptions to ${target.name}`,
              {
                duration: 8_000,
                action: {
                  label: 'Undo',
                  onClick: () =>
                    undoMove(result.undo, {
                      onSuccess: () =>
                        toast.success(`Moved back to ${sourceCollectionName}`),
                      onError: () =>
                        toast.error(
                          'Could not undo move. Refresh and try again.',
                        ),
                    }),
                },
              },
            );
          },
          onError: () => toast.error('Failed to move. Refresh and try again.'),
        },
      );
    },
    [moveSubscriptions, sourceCollectionName, undoMove],
  );

  return { move, isPending };
}

type MoveTargetsProps = {
  /** Every collection except the current one, ordered by name. */
  targets: CollectionRecord[];
  onSelect: (target: CollectionRecord) => void;
};

function MoveTargetItems({ targets, onSelect }: MoveTargetsProps) {
  return (
    <DropdownMenuGroup>
      {targets.map((target) => (
        <DropdownMenuItem key={target.id} onClick={() => onSelect(target)}>
          <span className="truncate">{target.name}</span>
        </DropdownMenuItem>
      ))}
    </DropdownMenuGroup>
  );
}

/** The row actions "Move to" submenu. */
export function MoveToSubmenu({ targets, onSelect }: MoveTargetsProps) {
  const label = <MenuActionItem icon={FolderInputIcon} label="Move to" />;

  if (targets.length === 0) {
    // Disabled menu items stay keyboard-focusable in Base UI. Restoring pointer
    // events lets hover reach the tooltip trigger too.
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <DropdownMenuItem
              disabled
              className="data-disabled:pointer-events-auto data-disabled:cursor-not-allowed"
            />
          }
        >
          {label}
        </TooltipTrigger>
        <TooltipContent>{NO_MOVE_TARGETS_MESSAGE}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>{label}</DropdownMenuSubTrigger>
      <DropdownMenuSubContent className="max-w-64">
        <MoveTargetItems targets={targets} onSelect={onSelect} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

/** The selection toolbar "Move to" button and its collection dropdown. */
export function MoveToButton({
  targets,
  disabled,
  onSelect,
}: MoveTargetsProps & { disabled?: boolean }) {
  const label = (
    <>
      <FolderInputIcon data-icon="inline-start" />
      Move to
    </>
  );

  if (targets.length === 0) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant="outline"
              size="sm"
              disabled
              focusableWhenDisabled
            />
          }
        >
          {label}
        </TooltipTrigger>
        <TooltipContent>{NO_MOVE_TARGETS_MESSAGE}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={<Button variant="outline" size="sm" />}
      >
        {label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-auto max-w-64 min-w-40">
        <MoveTargetItems targets={targets} onSelect={onSelect} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
