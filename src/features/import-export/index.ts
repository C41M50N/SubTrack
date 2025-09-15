import { z } from 'zod';
import { FREQUENCIES, ICONS } from '../common';

export const DataSchema = z
  .object({
    categories: z.array(z.string()),
    subscriptions: z.array(
      z.object({
        name: z.string(),
        amount: z.number().int().min(0),
        frequency: z.enum(FREQUENCIES),
        category: z.string(),
        next_invoice: z
          .string()
          .transform((val) => {
            // Convert MM/DD/YYYY to YYYY-MM-DDTHH:mm:ss.sssZ format (midnight UTC)
            const parts = val.split('/');
            if (parts.length !== 3) {
              throw new Error(`Invalid date format: ${val}`);
            }
            const [month, day, year] = parts;
            if (!(month && day && year)) {
              throw new Error(`Invalid date format: ${val}`);
            }
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
          })
          .pipe(z.string().datetime()),
        last_invoice: z
          .string()
          .or(z.null())
          .transform((val) => {
            if (val === null) {
              return null;
            }
            const parts = val.split('/');
            if (parts.length !== 3) {
              throw new Error(`Invalid date format: ${val}`);
            }
            const [month, day, year] = parts;
            if (!(month && day && year)) {
              throw new Error(`Invalid date format: ${val}`);
            }
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T00:00:00.000Z`;
          })
          .pipe(z.string().datetime().or(z.null())),
        icon_ref: z.enum(ICONS),
        send_alert: z.boolean(),
        collection: z.string(),
      })
    ),
  })
  .refine(
    (data) => {
      // Check that all categories exist
      return data.subscriptions.every((subscription) =>
        data.categories.includes(subscription.category)
      );
    },
    {
      message: 'All subscription categories must exist in the categories array',
    }
  )
  .refine(
    (data) => {
      // Check subscription names are unique across all collections
      // Group subscriptions by collection and check uniqueness within each collection
      const collectionGroups = data.subscriptions.reduce(
        (acc, subscription) => {
          let subs = acc[subscription.collection] || [];
          if (!subs) {
            subs = [];
          }
          subs.push(subscription.name);
          return acc;
        },
        {} as Record<string, string[]>
      );

      return Object.values(collectionGroups).every(
        (names) => names.length === new Set(names).size
      );
    },
    { message: 'Subscription names must be unique across all collections' }
  );
