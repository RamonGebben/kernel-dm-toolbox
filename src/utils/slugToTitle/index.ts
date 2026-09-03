/**
 * Turns an Open5e slug into a display label: `sleight-of-hand` → `Sleight Of
 * Hand`. Used wherever the source data supplies a key but no name — the
 * condition list is the main case.
 */
export const slugToTitle = (slug: string): string =>
  slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map(word => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(' ');
