import { deliverDueNotifications } from '@/features/notifications/delivery';
import { pruneNotificationHistory } from '@/features/notifications/maintenance';
import { scheduleDueNotifications } from '@/features/notifications/scheduler';
import { recordDueInvoices } from '@/jobs/due-invoices';
import { db } from '@/lib/db';
import { describeErrorSafely } from '@/lib/errors';

// The one recurring job for every user. It runs every five minutes, which
// reaches 9 a.m. in every time zone, including those offset by 30 or 45
// minutes, and leaves room for retries spaced minutes apart.
//
// Invoices are recorded first so overviews summarize complete months, then
// due notifications are scheduled and sent.

async function run() {
  const now = new Date();
  const invoices = await recordDueInvoices({ now });
  const scheduled = await scheduleDueNotifications({ now });
  const delivery = await deliverDueNotifications();

  await pruneNotificationHistory({ now });

  console.log(
    [
      `Recorded ${invoices.invoicesCreated} invoices for ${invoices.subscriptionsProcessed} subscriptions.`,
      `Scheduled ${scheduled.created} notifications.`,
      `Attempted ${delivery.attempted}: ${delivery.succeeded} sent, ${delivery.retrying} retrying, ${delivery.failed} failed, ${delivery.cancelled} cancelled, ${delivery.skipped} skipped.`,
    ].join(' '),
  );
}

try {
  await run();
} catch (error) {
  // Database errors can quote subscription details or destination secrets.
  console.error(`Scheduled jobs failed: ${describeErrorSafely(error)}`);
  process.exitCode = 1;
} finally {
  await db.$client.end();
}
