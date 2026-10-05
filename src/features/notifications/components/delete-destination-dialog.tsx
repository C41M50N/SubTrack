import { toast } from 'sonner';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { NOTIFICATION_KIND_LABELS } from '@/features/notifications/components/destination-display';
import { useDeleteDestination } from '@/features/notifications/mutations';
import type { DestinationRecord } from '@/features/notifications/queries';

type DeleteDestinationDialogProps = {
  destination: DestinationRecord | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteDestinationDialog({
  destination,
  onOpenChange,
}: DeleteDestinationDialogProps) {
  const deleteDestination = useDeleteDestination();
  const routes = destination?.routes ?? [];

  function handleConfirm() {
    if (!destination) {
      return;
    }

    deleteDestination.mutate(destination.id, {
      onSuccess: () => {
        toast.success(`Deleted “${destination.name}”`);
        onOpenChange(false);
      },
      onError: () => toast.error('Failed to delete the destination'),
    });
  }

  return (
    <AlertDialog open={destination !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{destination?.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Nothing more is sent to this destination, including notifications
            waiting to retry. Messages it already received aren’t affected.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {routes.length > 0 ? (
          <div className="rounded-lg border p-3 text-sm">
            <p className="font-medium">These routes will be removed:</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              {routes.map((route) => (
                <li key={`${route.collectionId}:${route.kind}`}>
                  <span className="text-foreground">
                    {route.collectionName}
                  </span>
                  {' · '}
                  {NOTIFICATION_KIND_LABELS[route.kind]}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No collections send notifications here.
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteDestination.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleConfirm}
            disabled={deleteDestination.isPending}
          >
            {deleteDestination.isPending ? 'Deleting…' : 'Delete destination'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
