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
import { useImportDataModalState } from '@/features/subscriptions/stores';
import { api } from '@/utils/api';
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '../ui/shadcn-io/dropzone';

export function ImportDataModal() {
  const state = useImportDataModalState();
  const [files, setFiles] = React.useState<File[] | undefined>();
  const [overwrite, setOverwrite] = React.useState<boolean>(false);
  const { mutateAsync: importData } = api.data.importData.useMutation();
  const apiUtils = api.useUtils();

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
    console.info(overwrite, JSON.parse(content));
    await importData({ json: content, overwrite });

    apiUtils.subscriptions.getSubscriptionsFromCollection.invalidate();
    apiUtils.categories.getCategories.invalidate();
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
            maxSize={1024 * 200} // 200 KB
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
              onValueChange={(v) => setOverwrite(v === 'overwrite')}
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
          <Button disabled={!files || files.length !== 1} onClick={onImport}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
