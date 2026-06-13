import type { CollectionWithoutUserId } from '@/features/collections';
import { DownloadCSVModal } from '@/features/dashboard/components/subscriptions-table/download-csv-modal';
import { ExportDataModal } from '@/features/dashboard/components/subscriptions-table/export-data-modal';
import { ImportDataModal } from '@/features/dashboard/components/subscriptions-table/import-data-modal';
import { ManageCategoriesModal } from '@/features/dashboard/components/subscriptions-table/manage-categories-modal';
import NewSubscriptionModal from '@/features/subscriptions/components/new-subscription-modal';

type DashboardModalHostProps = {
  categories: string[];
  collections: CollectionWithoutUserId[];
};

export function DashboardModalHost({
  categories,
  collections,
}: DashboardModalHostProps) {
  return (
    <>
      <NewSubscriptionModal categories={categories} collections={collections} />
      <ManageCategoriesModal categories={categories} />
      <ExportDataModal />
      <ImportDataModal />
      <DownloadCSVModal />
    </>
  );
}
