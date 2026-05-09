import type { CollectionWithoutUserId } from '@/features/collections';
import NewSubscriptionModal from '@/components/subscriptions/new-subscription-modal';
import { DownloadCSVModal } from '@/components/subscriptions-table/download-csv-modal';
import { ExportDataModal } from '@/components/subscriptions-table/export-data-modal';
import { ImportDataModal } from '@/components/subscriptions-table/import-data-modal';
import { ManageCategoriesModal } from '@/components/subscriptions-table/manage-categories-modal';

type DashboardModalHostProps = {
  categories: string[];
  collections: CollectionWithoutUserId[];
  onManageCategoriesClose: () => void;
};

export function DashboardModalHost({
  categories,
  collections,
  onManageCategoriesClose,
}: DashboardModalHostProps) {
  return (
    <>
      <NewSubscriptionModal
        categories={categories}
        collections={collections}
      />
      <ManageCategoriesModal
        categories={categories}
        onClose={onManageCategoriesClose}
      />
      <ExportDataModal />
      <ImportDataModal />
      <DownloadCSVModal />
    </>
  );
}
