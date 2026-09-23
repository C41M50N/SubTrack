import { DatabaseIcon, Trash2Icon } from 'lucide-react';
import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  useClearSubscriptions,
  useSeedSubscriptions,
} from '@/features/subscriptions/mutations';

type SeedDataCardProps = {
  collectionId: string;
};

// Dev-only tooling for populating or emptying the current collection. Rendered
// behind an import.meta.env.DEV gate, so it never ships in production builds.
export function SeedDataCard({ collectionId }: SeedDataCardProps) {
  const seedSubscriptions = useSeedSubscriptions();
  const clearSubscriptions = useClearSubscriptions();

  const [seedOpen, setSeedOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);

  const busy = seedSubscriptions.isPending || clearSubscriptions.isPending;

  function handleSeed() {
    seedSubscriptions.mutate(collectionId, {
      onSuccess: (result) => {
        toast.success(`Seeded ${result.subscriptionsSeeded} subscriptions`);
        setSeedOpen(false);
      },
      onError: () => toast.error('Failed to seed subscriptions'),
    });
  }

  function handleClear() {
    clearSubscriptions.mutate(collectionId, {
      onSuccess: (result) => {
        toast.success(`Cleared ${result.subscriptionsDeleted} subscriptions`);
        setClearOpen(false);
      },
      onError: () => toast.error('Failed to clear subscriptions'),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seed data</CardTitle>
        <CardDescription>
          Populate this collection with a sample set of subscriptions for
          testing. Seeding replaces every subscription in the collection.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button onClick={() => setSeedOpen(true)} disabled={busy}>
          <DatabaseIcon className="size-4" />
          Seed subscriptions
        </Button>
        <Button
          variant="outline"
          onClick={() => setClearOpen(true)}
          disabled={busy}
        >
          <Trash2Icon className="size-4" />
          Clear subscriptions
        </Button>
      </CardContent>

      <AlertDialog open={seedOpen} onOpenChange={setSeedOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed this collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every existing subscription in this
              collection and replaces them with sample data. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={seedSubscriptions.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleSeed}
              disabled={seedSubscriptions.isPending}
            >
              {seedSubscriptions.isPending ? 'Seeding…' : 'Seed'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear this collection?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes every subscription in this collection.
              This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearSubscriptions.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleClear}
              disabled={clearSubscriptions.isPending}
            >
              {clearSubscriptions.isPending ? 'Clearing…' : 'Clear'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
