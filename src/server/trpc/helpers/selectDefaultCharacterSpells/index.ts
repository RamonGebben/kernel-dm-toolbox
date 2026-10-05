import type { CharacterSpellInput } from '~/server/trpc/schemas/characters';

/** The `spells` columns this selection needs — a subset of the full row,
 * scoped (by whoever queries them) to the applied class and to level 0 plus
 * every level in `spellSlotLevels`. */
export type CandidateSpell = {
  slug: string;
  name: string;
  level: number;
  attackRoll: boolean;
  savingThrowAbility: string | null;
};

/** Cantrips are unlimited-use, so they matter most for "the PC always has
 * something to do" — two is enough variety without pretending to model a
 * real cantrip-known count, which `~/content/classProgression` doesn't
 * track. */
const MAX_DEFAULT_CANTRIPS = 2;

const isOffensive = (spell: CandidateSpell) =>
  spell.attackRoll || spell.savingThrowAbility !== null;

const byName = (a: CandidateSpell, b: CandidateSpell) =>
  a.name.localeCompare(b.name);

/**
 * Picks a small, offensive-leaning starter spell list for a freshly class-
 * templated caster: up to `MAX_DEFAULT_CANTRIPS` attack/save cantrips, plus
 * one offensive spell per distinct level in `spellSlotLevels` (the PC's
 * materialized spell slots — see `buildClassTemplateMaterialization`).
 *
 * A purely utility/buff spell (no attack roll, no saving throw) is never
 * chosen here — `selectAction` only ever picks an action with an `attack` or
 * a `save`, so granting one by default would still leave the PC unable to
 * act with it, defeating the point of this step. A DM who wants a support
 * caster to actually buff/heal instead still edits the spell list by hand
 * afterward, same as ever.
 *
 * For a slot level with no exact-level offensive spell in `candidates` (a
 * narrow class list, or a Warlock/Pact-caster slot level that outpaces its
 * spell list), the highest offensive spell at or below that level is used
 * instead — the same "close enough to be useful" spirit as this app's other
 * documented simplifications, rather than leaving that slot's level with no
 * spell at all.
 */
export const selectDefaultCharacterSpells = (
  candidates: readonly CandidateSpell[],
  spellSlotLevels: readonly number[],
): CharacterSpellInput[] => {
  const offensive = candidates.filter(isOffensive);

  const cantrips = offensive
    .filter(spell => spell.level === 0)
    .sort(byName)
    .slice(0, MAX_DEFAULT_CANTRIPS);

  const chosenSlugs = new Set(cantrips.map(spell => spell.slug));

  const leveledSpells = [...new Set(spellSlotLevels)]
    .sort((a, b) => a - b)
    .map(slotLevel => {
      const best = offensive
        .filter(
          spell =>
            spell.level > 0 &&
            spell.level <= slotLevel &&
            !chosenSlugs.has(spell.slug),
        )
        .sort((a, b) => b.level - a.level || byName(a, b))[0];

      if (best) chosenSlugs.add(best.slug);
      return best ?? null;
    })
    .filter((spell): spell is CandidateSpell => spell !== null);

  return [...cantrips, ...leveledSpells].map(spell => ({
    spellSlug: spell.slug,
    isPrepared: true,
    isAlwaysAvailable: spell.level === 0,
  }));
};
