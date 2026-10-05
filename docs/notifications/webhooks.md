# Notification webhooks

A generic webhook destination receives each renewal reminder and monthly overview as a signed JSON `POST`. This page is the contract for receivers. Discord destinations get a readable message built from the same data instead.

Amounts are integer cents in USD. Dates are calendar dates (`yyyy-MM-dd`) in the user's chosen time zone. Recorded invoices are snapshots of the schedule taken as each date came due, and projections come from the current schedule. Neither confirms a payment.

## Request

```http
POST /your/endpoint HTTP/1.1
Content-Type: application/json
User-Agent: EverySub-Notifications/1.0
webhook-id: evt_3fK8sLq2Wm9xRt5vB1nZc7Ad
webhook-timestamp: 1791118800
webhook-signature: v1,K5oZfzN95Z9UVu1EsfQmfVNQhnkZ2pj9o9NDN/H/pI4=
x-everysub-event-type: renewal_reminder
```

- Respond with any `2xx` status within 10 seconds to accept the event.
- EverySub never follows redirects. A `3xx`, or a `4xx` other than `408`, `425`, or `429`, is treated as a permanent rejection and pauses the destination until its owner resumes it.
- Timeouts, network errors, `408`, `425`, `429`, and `5xx` are retried up to four times over about an hour, with growing, jittered delays. A `Retry-After` header is honored, up to an hour.
- Endpoints must be public HTTPS addresses. EverySub checks every address the host resolves to, refuses private, loopback, link-local, and other reserved ranges, and connects only to an address it checked.

## Verifying signatures

Signatures follow the [Standard Webhooks](https://www.standardwebhooks.com) specification, so any of its libraries can verify them. To verify by hand:

1. Read the raw request body as bytes. Don't re-serialize parsed JSON.
2. Reject the request if `webhook-timestamp` is more than five minutes from your clock. This rejects replays.
3. Base64-decode the signing secret after its `whsec_` prefix to get the HMAC key.
4. Compute `base64(HMAC-SHA256(key, "{webhook-id}.{webhook-timestamp}.{body}"))`.
5. `webhook-signature` holds one or more space-separated `v1,<signature>` entries. Accept the request if any entry matches, using a constant-time comparison.

```ts
import { createHmac, timingSafeEqual } from 'node:crypto';

export function verifyEverySubWebhook(headers: Headers, body: string, secret: string): boolean {
  const id = headers.get('webhook-id');
  const timestamp = headers.get('webhook-timestamp');
  const signatures = headers.get('webhook-signature');

  if (!id || !timestamp || !signatures || Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) {
    return false;
  }

  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.${body}`).digest();

  return signatures.split(' ').some((entry) => {
    const [version, signature] = entry.split(',');
    const received = Buffer.from(signature ?? '', 'base64');

    return version === 'v1' && received.length === expected.length && timingSafeEqual(received, expected);
  });
}
```

The signing secret is shown once, when the destination is created or its secret is rotated. After a rotation, each rotated-out secret keeps signing requests for 24 hours alongside the new one, so a receiver keeps working while it switches over, even if the secret is rotated again in that time.

## Deduplication

`webhook-id` and the payload's `id` are the same stable event ID, and they don't change between retries. Delivery is at least once: a timeout can happen after your endpoint accepted a request, and EverySub then retries it. Store event IDs you've processed and ignore repeats.

The body is rebuilt before every attempt. If the user excludes a subscription or removes a route while a retry is pending, the retry omits it, and if nothing eligible remains the event is cancelled. A retried body can therefore differ from an earlier attempt with the same ID; treat the latest one as current.

## Envelope

Every event has the same envelope. `test` is `true` for test sends from settings, which carry only fictional sample data.

| Field                   | Description                                                  |
| ----------------------- | ------------------------------------------------------------ |
| `schemaVersion`         | `1`. Incremented for breaking changes.                       |
| `id`                    | Stable event ID, equal to `webhook-id`.                      |
| `type`                  | `renewal_reminder` or `monthly_overview`.                    |
| `test`                  | Whether this is a sample-data test.                          |
| `destination`           | The destination's `id` and `name`.                           |
| `schedule.localDate`    | The reminder date, or the first day of the overview's month. |
| `schedule.timeZone`     | The user's IANA time zone.                                   |
| `schedule.scheduledFor` | 9 a.m. on `localDate` in that time zone, as an ISO instant.  |

Excluded subscriptions never appear: they have no rows, no metadata, and no share of any count or total.

## `renewal_reminder`

One grouped event per destination per local day, listing every eligible charge expected within the user's lead time. Items group under the collection that routes them.

```json
{
  "schemaVersion": 1,
  "id": "evt_3fK8sLq2Wm9xRt5vB1nZc7Ad",
  "type": "renewal_reminder",
  "test": false,
  "destination": { "id": "d5Jq0rX2mN8bV4cT7yH1kL3p", "name": "Home automation" },
  "schedule": {
    "localDate": "2026-10-04",
    "timeZone": "America/New_York",
    "scheduledFor": "2026-10-04T13:00:00.000Z"
  },
  "data": {
    "leadDays": 3,
    "currency": "USD",
    "itemCount": 2,
    "totalExpectedAmountCents": 3298,
    "collections": [
      {
        "id": "sample-household",
        "name": "Household",
        "itemCount": 2,
        "subtotalExpectedAmountCents": 3298,
        "items": [
          {
            "subscriptionId": "sample-tunebox-family",
            "collectionId": "sample-household",
            "name": "Tunebox Family",
            "expectedInvoiceDate": "2026-10-06",
            "expectedAmountCents": 1699,
            "currency": "USD"
          },
          {
            "subscriptionId": "sample-streamline-video",
            "collectionId": "sample-household",
            "name": "Streamline Video",
            "expectedInvoiceDate": "2026-10-07",
            "expectedAmountCents": 1599,
            "currency": "USD"
          }
        ]
      }
    ]
  }
}
```

## `monthly_overview`

One event per destination per month, sent at 9 a.m. on the 1st, or as late as local day 7 if the scheduled send was missed. It's skipped when both months are empty.

- `previousMonth` lists invoices recorded during the complete previous month, each under the collection recorded on the invoice. A subscription deleted since has a `subscriptionId` of `null`.
- `newMonth` lists invoices already recorded this month (`source: "recorded"`, keyed by `invoiceId`), then the rest of each active subscription's schedule through the month's end (`source: "projected"`, keyed by `subscriptionId` and `date`). Each item's `id` is stable: the invoice ID, or `{subscriptionId}:{date}` for a projection.

```json
{
  "schemaVersion": 1,
  "id": "evt_9Hd2kPq7Vx4mLs1tR8wYb3Ne",
  "type": "monthly_overview",
  "test": false,
  "destination": { "id": "d5Jq0rX2mN8bV4cT7yH1kL3p", "name": "Home automation" },
  "schedule": {
    "localDate": "2026-10-01",
    "timeZone": "America/New_York",
    "scheduledFor": "2026-10-01T13:00:00.000Z"
  },
  "data": {
    "currency": "USD",
    "previousMonth": {
      "month": "2026-09",
      "basis": "recorded_scheduled_invoices",
      "itemCount": 1,
      "subtotalAmountCents": 1599,
      "collections": [
        {
          "id": "sample-household",
          "name": "Household",
          "itemCount": 1,
          "subtotalAmountCents": 1599,
          "items": [
            {
              "invoiceId": "sample-invoice-2026-09-0",
              "subscriptionId": "sample-streamline-video",
              "collectionId": "sample-household",
              "name": "Streamline Video",
              "iconRef": "example.com",
              "category": "Streaming",
              "invoiceDate": "2026-09-01",
              "amountCents": 1599,
              "currency": "USD"
            }
          ]
        }
      ]
    },
    "newMonth": {
      "month": "2026-10",
      "basis": "expected_schedule",
      "itemCount": 2,
      "recordedCount": 1,
      "projectedCount": 1,
      "subtotalExpectedAmountCents": 3298,
      "collections": [
        {
          "id": "sample-household",
          "name": "Household",
          "itemCount": 2,
          "subtotalExpectedAmountCents": 3298,
          "items": [
            {
              "id": "sample-invoice-2026-10-0",
              "source": "recorded",
              "invoiceId": "sample-invoice-2026-10-0",
              "subscriptionId": "sample-streamline-video",
              "collectionId": "sample-household",
              "name": "Streamline Video",
              "iconRef": "example.com",
              "category": "Streaming",
              "date": "2026-10-01",
              "expectedAmountCents": 1599,
              "currency": "USD"
            },
            {
              "id": "sample-tunebox-family:2026-10-05",
              "source": "projected",
              "subscriptionId": "sample-tunebox-family",
              "collectionId": "sample-household",
              "name": "Tunebox Family",
              "iconRef": "example.com",
              "category": "Music",
              "date": "2026-10-05",
              "expectedAmountCents": 1699,
              "currency": "USD"
            }
          ]
        }
      ]
    }
  }
}
```

Month totals are reported side by side but never compared. Different billing frequencies make a change between two months a poor measure of ongoing commitments.
