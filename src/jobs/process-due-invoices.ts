import { recordDueInvoices } from '@/jobs/due-invoices';
import { db } from '@/lib/db';

// Records due invoices on demand. The scheduled job in run-scheduled-jobs.ts
// does this too, before sending notifications.
const result = await recordDueInvoices();

console.log(`Processed ${result.subscriptionsProcessed} subscriptions and created ${result.invoicesCreated} invoices.`);

await db.$client.end();
