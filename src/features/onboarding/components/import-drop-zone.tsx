import { LockIcon, UploadIcon } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { SMART_IMPORT_DISCLOSURE } from '@/features/imports/components/import-upload-step';
import {
  EXPORT_FILE_ACCEPT,
  SMART_IMPORT_FILE_ACCEPT,
} from '@/features/imports/files';
import { StatementIllustration } from '@/features/onboarding/components/statement-illustration';
import { cn } from '@/lib/utils';

type ImportDropZoneProps = {
  /** Whether smart import can read statements and screenshots. */
  canReadFiles: boolean;
  /** Once something is added, importing is pitched at what's been forgotten. */
  hasSubscriptions: boolean;
  /** Starts an import with the chosen or dropped files. */
  onFiles: (files: File[], trigger: HTMLElement) => void;
};

/**
 * Onboarding's main way in: files dropped here or chosen with the button go
 * straight to the importer, where nothing is saved until it's reviewed.
 */
export function ImportDropZone({
  canReadFiles,
  hasSubscriptions,
  onFiles,
}: ImportDropZoneProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [dragging, setDragging] = useState(false);

  function startImport(files: File[]) {
    if (files.length > 0 && buttonRef.current) {
      // Dropping doesn't focus anything, so the button stands in as the
      // trigger focus returns to.
      onFiles(files, buttonRef.current);
    }
  }

  const copy = !canReadFiles
    ? {
        title: 'Import an EverySub export',
        description:
          'Bring in subscriptions from an EverySub JSON or CSV export. You check each one before anything is saved.',
      }
    : hasSubscriptions
      ? {
          title: 'Catch the ones you forgot',
          description:
            'Drop in a bank or card statement and EverySub picks out the recurring charges. You check each one before it’s saved.',
        }
      : {
          title: 'Drop in a statement',
          description:
            'Bank statements, card statements, or receipt screenshots. EverySub finds the subscriptions, and you check each one before it’s saved.',
        };

  return (
    <section
      aria-labelledby={titleId}
      data-dragging={dragging || undefined}
      onDragEnter={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={(event) => {
        // Moving between the zone's children fires leave events too.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setDragging(false);
        }
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        startImport([...event.dataTransfer.files]);
      }}
      className="@container relative flex min-h-100 overflow-hidden rounded-2xl border-[1.5px] border-dashed border-foreground/20 bg-muted/50 transition-[background-color,border-color] duration-150 ease-out data-dragging:border-primary data-dragging:bg-primary/5"
    >
      {/* Leaves room for the statement once the zone is wide enough for it. */}
      <div
        className={cn(
          'relative z-10 flex flex-1 flex-col justify-between gap-10 p-8',
          canReadFiles && '@[40rem]:max-w-82',
        )}
      >
        <div className="flex flex-col gap-2.5">
          <h2
            id={titleId}
            className="text-xl font-semibold tracking-[-0.015em]"
          >
            {copy.title}
          </h2>
          <p className="text-[15px]/6 text-pretty text-muted-foreground">
            {copy.description}
          </p>
        </div>
        <div className="flex flex-col items-start gap-4">
          <Button
            ref={buttonRef}
            size="lg"
            className="h-11 px-4 text-[15px]"
            onClick={() => inputRef.current?.click()}
          >
            <UploadIcon data-icon="inline-start" />
            Choose files
          </Button>
          <p className="font-mono text-xs/4.5 text-muted-foreground">
            {canReadFiles ? (
              <>
                <span className="block">PDF · PNG · JPEG · WebP</span>
                <span className="block">or an EverySub export</span>
              </>
            ) : (
              'EverySub JSON or CSV'
            )}
          </p>
          {/* Dropped files upload right away, so the disclosure the importer
              shows has to be here too. */}
          {canReadFiles ? (
            <p className="flex gap-1.5 text-xs text-pretty text-muted-foreground">
              <LockIcon className="mt-px size-3.5 shrink-0" aria-hidden />
              {SMART_IMPORT_DISCLOSURE}
            </p>
          ) : null}
        </div>
      </div>

      {canReadFiles ? (
        <StatementIllustration className="absolute top-10 right-7 hidden @[40rem]:block" />
      ) : null}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={
          canReadFiles
            ? `${EXPORT_FILE_ACCEPT},${SMART_IMPORT_FILE_ACCEPT}`
            : EXPORT_FILE_ACCEPT
        }
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          // Clear the input so choosing the same files again still fires.
          event.target.value = '';
          startImport(files);
        }}
      />
    </section>
  );
}
