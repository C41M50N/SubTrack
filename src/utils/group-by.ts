export function groupBy<T>(
  items: T[],
  fn: (item: T) => string | number
): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((groups, item) => {
    const groupKey = String(fn(item));
    const group = groups[groupKey] || [];
    group.push(item);
    groups[groupKey] = group;
    return groups;
  }, {});
}
