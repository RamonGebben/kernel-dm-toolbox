/**
 * Splits an array into fixed-size chunks.
 *
 * Used by the library import: SQLite binds one variable per column per row, so
 * a single insert of 331 creatures across ~70 columns would blow past the
 * statement variable limit.
 */
export const chunk = <TItem>(
  items: readonly TItem[],
  size: number,
): TItem[][] => {
  if (size < 1) return items.length ? [[...items]] : [];

  return items.reduce<TItem[][]>((chunks, item, index) => {
    if (index % size === 0) return [...chunks, [item]];

    const completed = chunks.slice(0, -1);
    const current = chunks[chunks.length - 1] ?? [];
    return [...completed, [...current, item]];
  }, []);
};
