import {
  EllipsisIcon,
  KeyRoundIcon,
  MailIcon,
  MessageCircleIcon,
  PauseIcon,
  PencilIcon,
  PlayIcon,
  PlusIcon,
  SendIcon,
  Trash2Icon,
  WebhookIcon,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { MenuActionItem } from '@/components/menu-action-item';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { DeleteDestinationDialog } from '@/features/notifications/components/delete-destination-dialog';
import {
  DESTINATION_TYPE_LABELS,
  DestinationHealthBadge,
  DestinationTypeIcon,
  EMAIL_STATUS_LABELS,
  formatTimestamp,
  NOTIFICATION_KIND_LABELS,
} from '@/features/notifications/components/destination-display';
import { DestinationFormDialog } from '@/features/notifications/components/destination-form-dialog';
import { EmailDestinationDialog } from '@/features/notifications/components/email-destination-dialog';
import {
  SigningSecretDialog,
  type RevealedSecret,
} from '@/features/notifications/components/signing-secret-dialog';
import {
  useRotateSigningSecret,
  useSendTestNotification,
  useSetDestinationPaused,
} from '@/features/notifications/mutations';
import type {
  DestinationRecord,
  NotificationSettingsData,
} from '@/features/notifications/queries';
import type { NotificationKind } from '@/lib/db/notification-schema';
import { cn } from '@/lib/utils';

type WebhookType = 'webhook' | 'discord';

export function DestinationsCard({ data }: { data: NotificationSettingsData }) {
  const [addType, setAddType] = useState<WebhookType>('discord');
  const [addOpen, setAddOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<DestinationRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DestinationRecord | null>(
    null,
  );
  const [revealed, setRevealed] = useState<RevealedSecret | null>(null);
  const rotateSecret = useRotateSigningSecret();

  const hasEmail = data.destinations.some(
    (destination) => destination.type === 'email',
  );

  function openAdd(type: WebhookType) {
    setAddType(type);
    setAddOpen(true);
  }

  function handleRotate(destination: DestinationRecord) {
    rotateSecret.mutate(destination.id, {
      onSuccess: (result) =>
        setRevealed({
          destinationName: destination.name,
          signingSecret: result.signingSecret,
          previousSecretExpiresAt: result.previousSecretExpiresAt
            ? new Date(result.previousSecretExpiresAt)
            : undefined,
        }),
      onError: () => toast.error('Failed to rotate the signing secret'),
    });
  }

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="border-b pb-(--card-spacing)">
        <CardTitle>Destinations</CardTitle>
        <CardDescription>
          Where notifications can go. Adding a destination doesn’t send
          anything; each collection chooses what to send where in its settings.
        </CardDescription>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button size="sm" />}>
              <PlusIcon data-icon="inline-start" />
              Add destination
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Add a destination</DropdownMenuLabel>
                <DropdownMenuItem
                  disabled={hasEmail || !data.email.available}
                  onClick={() => setEmailOpen(true)}
                >
                  <MenuActionItem icon={MailIcon} label="Email" />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openAdd('discord')}>
                  <MenuActionItem
                    icon={MessageCircleIcon}
                    label="Discord webhook"
                  />
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openAdd('webhook')}>
                  <MenuActionItem icon={WebhookIcon} label="Webhook" />
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>
      <CardContent className="p-0">
        {!data.email.available ? (
          <p className="border-b bg-muted/40 px-(--card-spacing) py-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Email is unavailable.
            </span>{' '}
            {data.email.message} Discord and webhooks still work.
          </p>
        ) : hasEmail ? null : (
          <p className="border-b bg-muted/40 px-(--card-spacing) py-3 text-sm text-muted-foreground">
            Email notifications go to your verified account email,{' '}
            {data.account.email}.
          </p>
        )}

        {data.destinations.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <SendIcon />
              </EmptyMedia>
              <EmptyTitle>No destinations yet</EmptyTitle>
              <EmptyDescription>
                Add email, a Discord webhook, or your own webhook. Then turn it
                on for the collections you want to hear about.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ul className="divide-y">
            {data.destinations.map((destination) => (
              <DestinationRow
                key={destination.id}
                destination={destination}
                onEdit={() => setEditTarget(destination)}
                onDelete={() => setDeleteTarget(destination)}
                onRotate={() => handleRotate(destination)}
              />
            ))}
          </ul>
        )}
      </CardContent>

      <DestinationFormDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        type={addType}
        onCreated={({ signingSecret, name }) => {
          if (signingSecret) {
            setRevealed({ destinationName: name, signingSecret });
          }
        }}
      />
      <DestinationFormDialog
        open={editTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditTarget(null);
          }
        }}
        destination={editTarget}
      />
      <EmailDestinationDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        accountEmail={data.account.email}
      />
      <DeleteDestinationDialog
        destination={deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      />
      <SigningSecretDialog
        secret={revealed}
        onOpenChange={(open) => {
          if (!open) {
            setRevealed(null);
          }
        }}
      />
    </Card>
  );
}

/** "Personal (Renewal reminders, Monthly overview) · Work (Renewal reminders)" */
function describeRoutes(destination: DestinationRecord): string | null {
  const kindsByCollection = new Map<string, NotificationKind[]>();

  for (const route of destination.routes) {
    const kinds = kindsByCollection.get(route.collectionName) ?? [];
    kinds.push(route.kind);
    kindsByCollection.set(route.collectionName, kinds);
  }

  if (kindsByCollection.size === 0) {
    return null;
  }

  return [...kindsByCollection]
    .map(
      ([collection, kinds]) =>
        `${collection} (${kinds.map((kind) => NOTIFICATION_KIND_LABELS[kind].toLowerCase()).join(', ')})`,
    )
    .join(' · ');
}

type DestinationRowProps = {
  destination: DestinationRecord;
  onEdit: () => void;
  onDelete: () => void;
  onRotate: () => void;
};

function DestinationRow({
  destination,
  onEdit,
  onDelete,
  onRotate,
}: DestinationRowProps) {
  const sendTest = useSendTestNotification();
  const setPaused = useSetDestinationPaused();
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const routes = describeRoutes(destination);
  const isProblem =
    destination.health === 'failing' ||
    destination.health === 'needs_attention';

  function handleTest(kind: NotificationKind) {
    setTestResult(null);
    sendTest.mutate(
      { destinationId: destination.id, kind },
      {
        onSuccess: (result) => setTestResult(result),
        onError: (error) =>
          setTestResult({ ok: false, message: error.message }),
      },
    );
  }

  function handlePausedChange(paused: boolean) {
    setPaused.mutate(
      { destinationId: destination.id, paused },
      {
        onSuccess: () =>
          toast.success(
            paused
              ? `Paused “${destination.name}”`
              : `Resumed “${destination.name}”`,
          ),
        onError: () => toast.error('Failed to update the destination'),
      },
    );
  }

  return (
    <li className="flex flex-col gap-4 px-(--card-spacing) py-4 sm:flex-row sm:items-start">
      <DestinationTypeIcon type={destination.type} />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-medium">{destination.name}</h3>
          <DestinationHealthBadge health={destination.health} />
        </div>
        <p className="text-sm break-all text-muted-foreground">
          {DESTINATION_TYPE_LABELS[destination.type]} · {destination.target}
        </p>
        <p
          className={cn(
            'text-sm',
            isProblem ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {destination.healthMessage}
        </p>
        {destination.lastSuccessAt || destination.lastFailureAt ? (
          <p className="text-xs text-muted-foreground">
            {destination.lastSuccessAt
              ? `Last ${destination.type === 'email' ? 'accepted' : 'delivered'} ${formatTimestamp(destination.lastSuccessAt)}`
              : 'Nothing delivered yet'}
            {destination.lastFailureAt
              ? ` · Last failure ${formatTimestamp(destination.lastFailureAt)}`
              : ''}
          </p>
        ) : null}
        {destination.latestEmail ? (
          <p className="text-xs text-muted-foreground">
            Latest email: {EMAIL_STATUS_LABELS[destination.latestEmail.status]}{' '}
            ({formatTimestamp(destination.latestEmail.at)})
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {routes
            ? `Used by ${routes}`
            : 'Not used by any collection. Turn it on in a collection’s settings.'}
        </p>
        {destination.previousSecretExpiresAt ? (
          <p className="text-xs text-muted-foreground">
            Earlier signing secrets also sign requests until{' '}
            {formatTimestamp(destination.previousSecretExpiresAt)}.
          </p>
        ) : null}
        <p
          role="status"
          className={cn(
            'text-sm',
            testResult?.ok === false ? 'text-destructive' : 'text-foreground',
          )}
        >
          {sendTest.isPending
            ? 'Sending test…'
            : testResult
              ? `${testResult.ok ? 'Test sent.' : 'Test failed.'} ${testResult.message}`
              : ''}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {destination.paused ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handlePausedChange(false)}
            disabled={setPaused.isPending}
          >
            <PlayIcon data-icon="inline-start" />
            Resume
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="sm"
                variant="outline"
                disabled={sendTest.isPending}
              />
            }
          >
            <SendIcon data-icon="inline-start" />
            Send test
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuGroup>
              <DropdownMenuLabel>Sample data only</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleTest('renewal_reminder')}>
                Test renewal reminder
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleTest('monthly_overview')}>
                Test monthly overview
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={`Options for ${destination.name}`}
              />
            }
          >
            <EllipsisIcon />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onEdit}>
                <MenuActionItem
                  icon={PencilIcon}
                  label={destination.type === 'email' ? 'Rename' : 'Edit'}
                />
              </DropdownMenuItem>
              {destination.type === 'webhook' ? (
                <DropdownMenuItem onClick={onRotate}>
                  <MenuActionItem
                    icon={KeyRoundIcon}
                    label="Rotate signing secret"
                  />
                </DropdownMenuItem>
              ) : null}
              {destination.paused ? null : (
                <DropdownMenuItem onClick={() => handlePausedChange(true)}>
                  <MenuActionItem icon={PauseIcon} label="Pause" />
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={onDelete}>
                <MenuActionItem
                  variant="destructive"
                  icon={Trash2Icon}
                  label="Delete"
                />
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </li>
  );
}
