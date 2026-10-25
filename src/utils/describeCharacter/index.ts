interface CharacterIdentity {
  level: number;
  className: string | null;
  subclass: string | null;
  species: string | null;
}

/**
 * The one-line "who is this" a roster row leads with — `Level 5 Goliath
 * Paladin · Oath of Glory` — skipping whatever has not been filled in, so a
 * character entered with only the tracker's numbers still reads `Level 5`.
 */
export const describeCharacter = ({
  level,
  className,
  subclass,
  species,
}: CharacterIdentity): string => {
  const headline = [`Level ${level}`, species, className]
    .filter(Boolean)
    .join(' ');

  return subclass ? `${headline} · ${subclass}` : headline;
};
