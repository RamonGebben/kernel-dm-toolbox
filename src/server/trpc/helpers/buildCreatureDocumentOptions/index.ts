import { CREATURE_LIBRARY_SOURCES } from '~/server/library/source';

export interface CreatureDocumentOption {
  value: string;
  label: string;
}

const documentTitles = new Map(
  CREATURE_LIBRARY_SOURCES.map(source => [
    source.path.split('/').pop() ?? source.path,
    source.title,
  ]),
);

/**
 * The distinct upstream documents (SRD, Monstrous Menagerie, Tome of Beasts,
 * …) actually present in the imported library, as filter options — mirrors
 * `buildCreatureTypeOptions`/`buildSpellClassOptions`. Derived from the data
 * rather than every entry in `CREATURE_LIBRARY_SOURCES`, since an instance
 * that hasn't imported a supplementary source yet shouldn't offer a filter
 * option with zero matches.
 *
 * `value` is the raw `document` column value (already stable — it's what the
 * import writes and what the query filters on); `label` looks it up against
 * the known sources for a human title, falling back to the raw value for a
 * document `CREATURE_LIBRARY_SOURCES` doesn't recognise rather than hiding
 * it.
 */
export const buildCreatureDocumentOptions = (
  documents: ReadonlyArray<string>,
): Array<CreatureDocumentOption> => {
  const values = new Set(
    documents.map(document => document.trim()).filter(Boolean),
  );

  return [...values]
    .map(value => ({ value, label: documentTitles.get(value) ?? value }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
