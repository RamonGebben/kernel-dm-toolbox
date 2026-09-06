/**
 * Open5e slugs are document-prefixed (`srd-2024_wizard`, `srd-2024_evocation`)
 * so upstream can tell sources apart; the prefix has nothing to show a user.
 */
export const stripDocumentPrefix = (slug: string): string =>
  slug.replace(/^[a-z0-9]+(?:-[a-z0-9]+)*_/, '');
