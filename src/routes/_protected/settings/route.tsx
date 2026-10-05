import {
  Link,
  Outlet,
  createFileRoute,
  useCanGoBack,
  useRouter,
} from '@tanstack/react-router';
import { ArrowLeftIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';

export const Route = createFileRoute('/_protected/settings')({
  component: SettingsLayout,
});

// Account settings aren't tied to a collection, so they sit outside the
// collection sidebar with a way back to wherever the user came from.
function SettingsLayout() {
  const router = useRouter();
  const canGoBack = useCanGoBack();

  return (
    <div className="min-h-svh bg-background">
      <header className="border-b">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-6 py-3">
          {canGoBack ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.history.back()}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Back
            </Button>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              nativeButton={false}
              render={<Link to="/dashboard" />}
            >
              <ArrowLeftIcon data-icon="inline-start" />
              Back to EverySub
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Account settings
          </span>
        </div>
      </header>
      <main className="mx-auto w-full max-w-3xl px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
