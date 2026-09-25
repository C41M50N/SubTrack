/**
 * The key a category name is compared by. Category names are unique per
 * collection by `lower(name)`, so two names with the same key are the same
 * category.
 */
export function toCategoryNameKey(name: string): string {
  return name.toLowerCase();
}

/** Removes case-insensitive duplicates, keeping the first casing seen. */
export function dedupeCategoryNames(names: Iterable<string>): string[] {
  const namesByKey = new Map<string, string>();

  for (const name of names) {
    const key = toCategoryNameKey(name);

    if (!namesByKey.has(key)) {
      namesByKey.set(key, name);
    }
  }

  return [...namesByKey.values()];
}
