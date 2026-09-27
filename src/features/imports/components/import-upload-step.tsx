import {
  CircleAlertIcon,
  FileTextIcon,
  ImageIcon,
  InfoIcon,
  LockIcon,
  UploadIcon,
  XIcon,
} from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  EXPORT_FILE_ACCEPT,
  formatFileSize,
  SMART_IMPORT_FILE_ACCEPT,
} from '@/features/imports/files';
import { cn } from '@/lib/utils';

export type UploadNotice = {
  tone: 'error' | 'info';
  message: string;
};

/** Whether PDFs and images can be sent to smart import right now. */
export type SmartImportAvailability =
  | { enabled: true; usageMessage: string | null }
  | { enabled: false; reason: 'unconfigured' | 'limited'; message: string };

type ImportUploadStepProps = {
  smartImport: SmartImportAvailability;
  attachedFiles: File[];
  notice: UploadNotice | null;
  /** True while files are checked before a run starts. */
  checking: boolean;
  /** Labels the attached files' action, e.g. "Retry" after a failed run. */
  runLabel: string;
  /** False when smart import is unconfigured or at a usage limit. */
  canRun: boolean;
  onSelectFiles: (files: File[]) => void;
  onRemoveFile: (file: File) => void;
  onRun: () => void;
};

export function ImportUploadStep({
  smartImport,
  attachedFiles,
  notice,
  checking,
  runLabel,
  canRun,
  onSelectFiles,
  onRemoveFile,
  onRun,
}: ImportUploadStepProps) {
  return (
    <div className="flex flex-col gap-4 px-6 pb-6">
      <DropZone
        smartImport={smartImport}
        checking={checking}
        onSelectFiles={onSelectFiles}
      />

      {notice && (
        <Alert variant={notice.tone === 'error' ? 'destructive' : 'default'}>
          {notice.tone === 'error' ? <CircleAlertIcon /> : <InfoIcon />}
          <AlertDescription
            className={cn(notice.tone === 'error' && 'text-destructive/90')}
          >
            {notice.message}
          </AlertDescription>
        </Alert>
      )}

      {attachedFiles.length > 0 && (
        <AttachedFiles
          files={attachedFiles}
          disabled={checking}
          canRun={canRun}
          runLabel={runLabel}
          onRemoveFile={onRemoveFile}
          onRun={onRun}
        />
      )}

      {smartImport.enabled && (
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <LockIcon className="size-3.5" aria-hidden />
            Files are sent to OpenAI to extract subscriptions and aren’t stored.
          </p>
          {smartImport.usageMessage && (
            <p className="tabular-nums">{smartImport.usageMessage}</p>
          )}
        </div>
      )}
    </div>
  );
}

type DropZoneProps = {
  smartImport: SmartImportAvailability;
  checking: boolean;
  onSelectFiles: (files: File[]) => void;
};

function DropZone({ smartImport, checking, onSelectFiles }: DropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const hintId = useId();
  const [dragging, setDragging] = useState(false);

  const accept = smartImport.enabled
    ? `${EXPORT_FILE_ACCEPT},${SMART_IMPORT_FILE_ACCEPT}`
    : EXPORT_FILE_ACCEPT;

  function openPicker() {
    if (!checking) {
      inputRef.current?.click();
    }
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);

    if (!checking) {
      onSelectFiles([...event.dataTransfer.files]);
    }
  }

  const zone = (
    <div
      role="button"
      tabIndex={checking ? -1 : 0}
      aria-disabled={checking || undefined}
      aria-describedby={hintId}
      data-dragging={dragging || undefined}
      onClick={openPicker}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          openPicker();
        }
      }}
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
      onDrop={handleDrop}
      className={cn(
        'flex min-h-60 flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-foreground/20 bg-muted/30 p-8 text-center outline-none transition-[background-color,border-color] duration-150 ease-out',
        'hover:border-foreground/30 hover:bg-muted/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50',
        'data-dragging:border-primary data-dragging:bg-primary/5',
        checking && 'pointer-events-none',
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-xl bg-background text-muted-foreground shadow-xs ring-1 ring-foreground/10">
        {checking ? (
          <Spinner role="presentation" aria-label={undefined} />
        ) : (
          <UploadIcon className="size-5" aria-hidden />
        )}
      </span>
      <div className="flex max-w-md flex-col gap-1">
        <p className="font-medium text-foreground">
          {checking ? (
            'Checking files…'
          ) : (
            <>
              Drop files here or{' '}
              <span className="text-primary underline-offset-4">browse</span>
            </>
          )}
        </p>
        <p id={hintId} className="text-pretty text-muted-foreground">
          {smartImport.enabled
            ? 'A SubTrack JSON or CSV export, or up to 5 statements, receipts, or screenshots as PDF, PNG, JPEG, or WebP.'
            : 'A SubTrack JSON or CSV export.'}
        </p>
        {!smartImport.enabled && smartImport.reason === 'limited' && (
          <p className="text-pretty text-muted-foreground tabular-nums">
            {smartImport.message}
          </p>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={accept}
        hidden
        onChange={(event) => {
          const files = [...(event.target.files ?? [])];
          // Clear the input so choosing the same files again still fires.
          event.target.value = '';

          if (files.length > 0) {
            onSelectFiles(files);
          }
        }}
      />
    </div>
  );

  if (!smartImport.enabled && smartImport.reason === 'unconfigured') {
    return (
      <Tooltip>
        <TooltipTrigger render={zone} />
        <TooltipContent>{smartImport.message}</TooltipContent>
      </Tooltip>
    );
  }

  return zone;
}

type AttachedFilesProps = {
  files: File[];
  disabled: boolean;
  canRun: boolean;
  runLabel: string;
  onRemoveFile: (file: File) => void;
  onRun: () => void;
};

function AttachedFiles({
  files,
  disabled,
  canRun,
  runLabel,
  onRemoveFile,
  onRun,
}: AttachedFilesProps) {
  return (
    <div className="flex items-end justify-between gap-4">
      <ul
        className="flex min-w-0 flex-1 flex-col gap-1"
        aria-label="Attached files"
      >
        {files.map((file) => {
          const Icon = file.type.startsWith('image/')
            ? ImageIcon
            : FileTextIcon;

          return (
            <li
              key={`${file.name}-${file.size}-${file.lastModified}`}
              className="flex min-w-0 items-center gap-2 text-sm"
            >
              <Icon
                className="size-4 shrink-0 text-muted-foreground"
                aria-hidden
              />
              <span className="truncate">{file.name}</span>
              <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                {formatFileSize(file.size)}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="shrink-0 text-muted-foreground"
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                onClick={() => onRemoveFile(file)}
              >
                <XIcon />
              </Button>
            </li>
          );
        })}
      </ul>
      <Button onClick={onRun} disabled={disabled || !canRun}>
        {runLabel}
      </Button>
    </div>
  );
}
