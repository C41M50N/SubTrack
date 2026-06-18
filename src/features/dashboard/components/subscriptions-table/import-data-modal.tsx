import React from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '@/components/ui/shadcn-io/dropzone';
import { useImportData } from '@/features/import-export/hooks';
import { useImportDataModalState } from '@/features/subscriptions/stores';

const BYTES_PER_KIBIBYTE = 1024;
const JSON_IMPORT_MAX_SIZE_KIBIBYTES = 200;
const JSON_IMPORT_MAX_SIZE_BYTES =
  BYTES_PER_KIBIBYTE * JSON_IMPORT_MAX_SIZE_KIBIBYTES;

export function ImportDataModal() {
  const state = useImportDataModalState();
  const [files, setFiles] = React.useState<File[] | undefined>();
  const overwriteRef = React.useRef(false);
  const { importData, isImportDataLoading } = useImportData();

  async function onImport() {
    const file = files && files[0];
    if (!files || files.length !== 1 || !file) {
      return;
    }

    if (file.type !== 'application/json') {
      console.error('Invalid file type');
      return;
    }

    const content = await file.text();
    await importData({ json: content, overwrite: overwriteRef.current });

    setFiles(undefined);
    state.set('closed');
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && state.set('closed')}
      open={state.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
          <DialogDescription>
            Choose a .subtrack.json file to import your data from.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Dropzone
            accept={{
              'application/json': ['.json'],
            }}
            maxFiles={1}
            maxSize={JSON_IMPORT_MAX_SIZE_BYTES}
            minSize={2}
            onDrop={(_files: File[]) => setFiles(_files)}
            onError={console.error}
            src={files}
          >
            <DropzoneEmptyState />
            <DropzoneContent />
          </Dropzone>

          <div className="mt-4 flex flex-row space-x-3">
            <RadioGroup
              className="flex flex-row space-x-4"
              defaultValue="append"
              onValueChange={(v) => {
                overwriteRef.current = v === 'overwrite';
              }}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="append" value="append" />
                <Label htmlFor="append">Append</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="overwrite" value="overwrite" />
                <Label htmlFor="overwrite">Overwrite</Label>
              </div>
            </RadioGroup>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => state.set('closed')} variant="outline">
            Cancel
          </Button>
          <Button
            disabled={!files || files.length !== 1}
            isLoading={isImportDataLoading}
            onClick={onImport}
          >
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
