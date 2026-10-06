import { useQuery } from '@tanstack/react-query';
import {
  PencilLineIcon,
  PlusIcon,
  ReceiptTextIcon,
  UploadIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { smartImportStatusQueryOptions } from '@/features/imports/queries';
import { cn } from '@/lib/utils';

type EntryHandler = (trigger: HTMLElement) => void;

type WelcomePanelProps = {
  onImport: EntryHandler;
  onAdd: EntryHandler;
};

/**
 * The dashboard's first-run state, shown until the account saves its first
 * subscription. Importing comes first because it fills in the most with the
 * least typing; adding by hand is always right beside it.
 */
export function WelcomePanel({ onImport, onAdd }: WelcomePanelProps) {
  const { data: smartImport } = useQuery(smartImportStatusQueryOptions());
  // Until the status loads, describe the full importer, as the importer does.
  const canReadFiles = smartImport?.configured ?? true;

  return (
    <section
      aria-labelledby="welcome-title"
      className="overflow-hidden rounded-xl bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10"
    >
      <div className="flex flex-col gap-1.5 px-8 pt-8 pb-7">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Welcome to EverySub
        </p>
        <h2
          id="welcome-title"
          className="font-heading text-2xl font-semibold tracking-tight text-balance"
        >
          Add your subscriptions to see what they cost
        </h2>
        <p className="max-w-2xl text-pretty text-muted-foreground">
          Your dashboard fills in with monthly spending and upcoming renewals as
          you add subscriptions. Start with the ones you know. You can add more
          anytime.
        </p>
      </div>

      <div className="grid border-t lg:grid-cols-[3fr_2fr]">
        <EntryOption
          emphasis
          icon={ReceiptTextIcon}
          title={
            canReadFiles
              ? 'Import from statements and receipts'
              : 'Import an EverySub export'
          }
          description={
            canReadFiles
              ? 'Upload PDFs or screenshots. EverySub finds the subscriptions in them, and you check each one before anything is saved.'
              : 'Bring in subscriptions from an EverySub JSON or CSV export. You check each one before anything is saved.'
          }
          formats={
            canReadFiles
              ? ['PDF', 'PNG', 'JPEG', 'WebP', 'EverySub export']
              : ['EverySub JSON', 'EverySub CSV']
          }
          action={
            <Button onClick={(event) => onImport(event.currentTarget)}>
              <UploadIcon data-icon="inline-start" />
              Import subscriptions
            </Button>
          }
        />
        <EntryOption
          icon={PencilLineIcon}
          title="Add one by hand"
          description="Enter a name, price, billing frequency, and next renewal date."
          action={
            <Button
              variant="outline"
              onClick={(event) => onAdd(event.currentTarget)}
            >
              <PlusIcon data-icon="inline-start" />
              Add manually
            </Button>
          }
          className="border-t lg:border-t-0 lg:border-l"
        />
      </div>
    </section>
  );
}

type EntryOptionProps = {
  icon: React.ElementType;
  title: string;
  description: string;
  /** What the option accepts, so supported sources are explicit. */
  formats?: string[];
  action: React.ReactNode;
  emphasis?: boolean;
  className?: string;
};

function EntryOption({
  icon: Icon,
  title,
  description,
  formats,
  action,
  emphasis = false,
  className,
}: EntryOptionProps) {
  return (
    <div className={cn('flex flex-col gap-5 p-8', className)}>
      <span
        className={cn(
          'flex size-10 items-center justify-center rounded-lg ring-1 ring-inset',
          emphasis
            ? 'bg-primary/8 text-primary ring-primary/15'
            : 'bg-muted text-muted-foreground ring-border',
        )}
        aria-hidden
      >
        <Icon className="size-5" />
      </span>
      <div className="flex flex-col gap-1.5">
        <h3 className="font-heading text-base font-semibold">{title}</h3>
        <p className="max-w-md text-pretty text-muted-foreground">
          {description}
        </p>
      </div>
      {formats ? (
        <ul aria-label="Supported files" className="flex flex-wrap gap-1.5">
          {formats.map((format) => (
            <li key={format}>
              <Badge variant="outline" className="text-muted-foreground">
                {format}
              </Badge>
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-auto pt-1">{action}</div>
    </div>
  );
}
