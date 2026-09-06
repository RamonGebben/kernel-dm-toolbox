import { slugToTitle } from '~/utils/slugToTitle';
import { stripDocumentPrefix } from '~/utils/stripDocumentPrefix';

export type SpellClassOption = {
  slug: string;
  label: string;
};

/**
 * The distinct classes actually present in the imported spell list, as filter
 * options. Derived from the data rather than a hardcoded roster: which
 * classes have spells depends on what got imported, not on the ruleset.
 */
export const buildSpellClassOptions = (
  classesByRow: readonly string[][],
): SpellClassOption[] => {
  const slugs = new Set(classesByRow.flat());

  return [...slugs]
    .map(slug => ({ slug, label: slugToTitle(stripDocumentPrefix(slug)) }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
