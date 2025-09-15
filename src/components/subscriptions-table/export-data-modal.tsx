import dayjs from 'dayjs';
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
import { useExportDataModalState } from '@/features/subscriptions/stores';
import { downloadFile } from '@/utils';
import { api } from '@/utils/api';

export function ExportDataModal() {
  const state = useExportDataModalState();
  const { mutateAsync: getExportData } = api.data.getExportData.useMutation();
  const [loading, setLoading] = React.useState(false);

  async function onExport() {
    setLoading(true);
    const data = await getExportData({
      format: 'json',
      collectionId: null,
    });
    const file = new File(
      [JSON.stringify(data, null, 2)],
      `subscriptions_${dayjs().format('YYYYMMDD_X')}.subtrack.json`,
      { type: 'application/json' }
    );
    downloadFile(file);
    setLoading(false);
    state.set('closed');
  }

  return (
    <Dialog
      onOpenChange={(open) => !open && state.set('closed')}
      open={state.state === 'open'}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Data</DialogTitle>
          <DialogDescription>
            This will download your data in JSON format. You can use this file
            to import your data into another account or as a backup.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => state.set('closed')} variant="outline">
            Cancel
          </Button>
          <Button isLoading={loading} onClick={onExport}>
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
