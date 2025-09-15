import dayjs from 'dayjs';
import { download, generateCsv, mkConfig } from 'export-to-csv';
import { useAtom } from 'jotai';
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
import { selectedCollectionIdAtom } from '@/features/common/atoms';
import { useDownloadCSVModalState } from '@/features/subscriptions/stores';
import { api } from '@/utils/api';

export function DownloadCSVModal() {
  const state = useDownloadCSVModalState();
  const { mutateAsync: getExportData } = api.data.getExportData.useMutation();
  const [loading, setLoading] = React.useState(false);
  const [selectedCollectionId] = useAtom(selectedCollectionIdAtom);

  async function handleDownload() {
    setLoading(true);
    const subs = (
      await getExportData({
        format: 'csv',
        collectionId: selectedCollectionId,
      })
    ).subscriptions;
    const csvConfig = mkConfig({
      filename: `SubTrack Subscriptions - ${dayjs().format('YYYYMMDD_X')}`,
      fileExtension: 'csv',
      columnHeaders: [
        { key: 'name', displayLabel: 'Name' },
        { key: 'amount', displayLabel: 'Amount' },
        { key: 'frequency', displayLabel: 'Invoice Frequency' },
        { key: 'category', displayLabel: 'Category' },
        { key: 'icon_ref', displayLabel: 'Icon' },
        { key: 'next_invoice', displayLabel: 'Next Invoice' },
        { key: 'last_invoice', displayLabel: 'Last Invoice' },
        { key: 'collection', displayLabel: 'Collection' },
        { key: 'send_alert', displayLabel: 'Send Alert' },
      ],
      useKeysAsHeaders: false,
    });
    const csv = generateCsv(csvConfig)(subs);
    download(csvConfig)(csv);
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
          <DialogTitle>Download CSV</DialogTitle>
          <DialogDescription>
            Click the button below to download a CSV of all subscriptions in
            this collection.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button onClick={() => state.set('closed')} variant="outline">
            Cancel
          </Button>
          <Button isLoading={loading} onClick={handleDownload}>
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
