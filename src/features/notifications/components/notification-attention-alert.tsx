import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { BellOffIcon } from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { notificationDestinationsQueryOptions } from '@/features/notifications/queries';

/**
 * Names every destination that needs the user's attention, such as one paused
 * after a rejection. Renders nothing when all is well.
 */
export function NotificationAttentionAlert({
  showSettingsLink = true,
}: {
  showSettingsLink?: boolean;
}) {
  const { data: destinations } = useQuery(
    notificationDestinationsQueryOptions(),
  );
  const flagged = (destinations ?? []).filter(
    (destination) =>
      destination.health === 'needs_attention' ||
      destination.health === 'failing',
  );

  if (flagged.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive">
      <BellOffIcon />
      <AlertTitle>
        {flagged.length === 1
          ? `“${flagged[0].name}” needs attention`
          : `${flagged.length} notification destinations need attention`}
      </AlertTitle>
      <AlertDescription>
        <ul className="space-y-0.5">
          {flagged.map((destination) => (
            <li key={destination.id}>
              {flagged.length > 1 ? (
                <span className="font-medium">{destination.name}: </span>
              ) : null}
              {destination.healthMessage}
            </li>
          ))}
        </ul>
        {showSettingsLink ? (
          <p className="mt-1">
            <Link to="/settings/notifications">
              Review notification settings
            </Link>
          </p>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
