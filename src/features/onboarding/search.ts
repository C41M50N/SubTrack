// Guided reminder setup runs through the existing settings pages. The search
// params carry the collection it's for, so the handoff between the account and
// collection pages keeps its context.

export type NotificationSettingsSearch = {
  /** Shows guided reminder setup for this collection. */
  remindersFor?: string;
};

export function validateNotificationSettingsSearch(search: Record<string, unknown>): NotificationSettingsSearch {
  return {
    remindersFor:
      typeof search.remindersFor === 'string' && search.remindersFor !== '' ? search.remindersFor : undefined,
  };
}

export type CollectionSettingsSearch = {
  /** Shows the last step of guided reminder setup. */
  setup?: 'reminders';
};

export function validateCollectionSettingsSearch(search: Record<string, unknown>): CollectionSettingsSearch {
  return { setup: search.setup === 'reminders' ? 'reminders' : undefined };
}
