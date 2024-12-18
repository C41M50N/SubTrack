import { z } from "zod";
import { FREQUENCIES, ICONS } from "../common/types";

export const DataSchema = z.object({
  categories: z.array(z.string()),
  collections: z.array(z.object({
    title: z.string(),
    subscriptions: z.array(z.object({
      name: z.string(),
      amount: z.number().int().min(0),
      frequency: z.enum(FREQUENCIES),
      category: z.string(),
      next_invoice: z.string().datetime(),
      last_invoice: z.string().datetime().or(z.null()),
      icon_ref: z.enum(ICONS),
      send_alert: z.boolean(),
    }))
  }))
})
.refine(
  (data) => {
    // Check that all categories exist
    return data.collections.every(collection =>
      collection.subscriptions.every(subscription =>
        data.categories.includes(subscription.category)
      )
    );
  }, 
  { message: "All subscription categories must exist in the categories array" }
)
.refine(
  (data) => {
    // Check collection titles are unique
    const titles = data.collections.map(c => c.title);
    return titles.length === new Set(titles).size;
  },
  { message: "Collection titles must be unique" }
)
.refine(
  (data) => {
    // Check subscription names are unique across all collections
    const names = data.collections.flatMap(c => 
      c.subscriptions.map(s => s.name)
    );
    return names.length === new Set(names).size;
  },
  { message: "Subscription names must be unique across all collections" }
);
