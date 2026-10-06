import { useNavigate } from '@tanstack/react-router';
import { CircleAlertIcon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Spinner } from '@/components/ui/spinner';
import { authClient } from '@/features/auth/client';
import { getBrowserTimeZone } from '@/features/notifications/time';
import { useSetUpAccount } from '@/features/onboarding/mutations';

/**
 * Shown while an account without collections gets its Personal collection,
 * then opens that collection's dashboard. There's nothing to fill in; the
 * browser's time zone is the only input.
 */
export function AccountSetup() {
  const navigate = useNavigate();
  const { mutateAsync: setUpAccount } = useSetUpAccount();
  const [failed, setFailed] = useState(false);
  const startedRef = useRef(false);

  // Awaited rather than observed: Strict Mode's remount detaches a mutation
  // observer from a mutation started in an effect, so its state and per-call
  // callbacks would never update.
  const run = useCallback(async () => {
    setFailed(false);

    try {
      const { collectionId } = await setUpAccount(
        getBrowserTimeZone() ?? undefined,
      );

      await navigate({
        to: '/c/$collectionId/dashboard',
        params: { collectionId },
        replace: true,
      });
    } catch {
      setFailed(true);
    }
  }, [setUpAccount, navigate]);

  // Setup is safe to repeat, but there's no reason to ask twice when Strict
  // Mode runs effects again.
  useEffect(() => {
    if (!startedRef.current) {
      startedRef.current = true;
      void run();
    }
  }, [run]);

  async function handleSignOut() {
    const { error } = await authClient.signOut();

    if (error) {
      toast.error('Couldn’t log out. Try again.');
      return;
    }

    window.location.assign('/');
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      {failed ? (
        <Empty role="alert" className="max-w-md">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <CircleAlertIcon className="text-destructive" />
            </EmptyMedia>
            <EmptyTitle>Your account isn’t ready yet</EmptyTitle>
            <EmptyDescription>
              EverySub couldn’t create your first collection. Check your
              connection and try again.
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent className="flex-row justify-center">
            <Button variant="ghost" onClick={() => void handleSignOut()}>
              Log out
            </Button>
            <Button autoFocus onClick={() => void run()}>
              Try again
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div
          role="status"
          className="flex flex-col items-center gap-3 text-sm text-muted-foreground"
        >
          <Spinner
            role="presentation"
            aria-label={undefined}
            className="size-5"
          />
          Setting up your account…
        </div>
      )}
    </main>
  );
}
