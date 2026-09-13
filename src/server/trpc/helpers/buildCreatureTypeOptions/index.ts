import { slugToTitle } from '~/utils/slugToTitle';

export type CreatureTypeOption = {
  value: string;
  label: string;
};

/**
 * The distinct creature types actually present across the library and the
 * DM's own custom creatures, as filter options — mirrors
 * `buildSpellClassOptions`. Derived from the data rather than a hardcoded
 * roster (undead, dragon, construct, …) since a custom creature's type is
 * freeform text, not one of Open5e's fixed values.
 *
 * `value` is lowercased so the filter can match a library row and a
 * differently-cased custom row (`Dragon` vs `dragon`) as the same option.
 */
export const buildCreatureTypeOptions = (
  types: readonly string[],
): CreatureTypeOption[] => {
  const values = new Set(
    types.map(type => type.trim().toLowerCase()).filter(Boolean),
  );

  return [...values]
    .map(value => ({ value, label: slugToTitle(value) }))
    .sort((a, b) => a.label.localeCompare(b.label));
};
