import { format } from 'date-fns';
import { MailIcon, MessageCircleIcon, WebhookIcon } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import type { DestinationHealth } from '@/features/notifications/server';
import type {
  EmailDeliveryStatus,
  NotificationDestinationType,
  NotificationKind,
} from '@/lib/db/notification-schema';
import { cn } from '@/lib/utils';

export const DESTINATION_TYPE_LABELS: Record<
  NotificationDestinationType,
  string
> = {
  email: 'Email',
  discord: 'Discord webhook',
  webhook: 'Webhook',
};

export const NOTIFICATION_KIND_LABELS: Record<NotificationKind, string> = {
  renewal_reminder: 'Renewal reminders',
  monthly_overview: 'Monthly overview',
};

const TYPE_ICONS = {
  email: MailIcon,
  discord: MessageCircleIcon,
  webhook: WebhookIcon,
} satisfies Record<NotificationDestinationType, React.ElementType>;

export function DestinationTypeIcon({
  type,
  className,
}: {
  type: NotificationDestinationType;
  className?: string;
}) {
  const Icon = TYPE_ICONS[type];

  return (
    <span
      className={cn(
        'flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-inset ring-border',
        className,
      )}
      aria-hidden
    >
      <Icon className="size-4.5" />
    </span>
  );
}

const HEALTH_BADGES: Record<
  DestinationHealth,
  { label: string; variant: 'secondary' | 'outline' | 'destructive' }
> = {
  ready: { label: 'Ready', variant: 'outline' },
  healthy: { label: 'Active', variant: 'secondary' },
  failing: { label: 'Failing', variant: 'destructive' },
  paused: { label: 'Paused', variant: 'outline' },
  needs_attention: { label: 'Needs attention', variant: 'destructive' },
};

/** The destination's state in words, so it never depends on color alone. */
export function DestinationHealthBadge({
  health,
}: {
  health: DestinationHealth;
}) {
  const badge = HEALTH_BADGES[health];

  return <Badge variant={badge.variant}>{badge.label}</Badge>;
}

export const EMAIL_STATUS_LABELS: Record<EmailDeliveryStatus, string> = {
  accepted: 'Accepted by Resend. Delivery not confirmed yet',
  delayed: 'Delivery delayed. Resend is still trying',
  delivered: 'Delivered to your email provider',
  bounced: 'Bounced',
  complained: 'Marked as spam',
  suppressed: 'Not sent: address suppressed by Resend',
  failed: 'Resend couldn’t deliver it',
};

export function formatTimestamp(date: Date | string): string {
  return format(new Date(date), "MMM d 'at' h:mm a");
}
