import { queryOptions } from '@tanstack/react-query';

import { getSmartImportStatus } from '@/features/imports/api';

export const smartImportStatusQueryKey = ['smart-import', 'status'] as const;

export function smartImportStatusQueryOptions() {
  return queryOptions({
    queryKey: smartImportStatusQueryKey,
    queryFn: () => getSmartImportStatus(),
  });
}
