import { and, inArray, isNotNull, or, eq, sql } from 'drizzle-orm';
import { spells } from '~/server/db/schema';
import type { Database } from '~/server/db';
import type { CharacterSpellInput } from '~/server/trpc/schemas/characters';
import { selectDefaultCharacterSpells } from '~/server/trpc/helpers/selectDefaultCharacterSpells';

/** The only caster types `~/content/spellSlotsByCasterType` actually grants
 * slots for — a `NONE` (or any other non-caster) class gets no default
 * spells, matching `buildClassTemplateMaterialization`'s own spell-slot
 * gating. */
const CASTER_TYPES_WITH_SPELLS = ['FULL', 'HALF', 'PACT'];

/**
 * The impure edge for `selectDefaultCharacterSpells`: fetches the applied
 * class's cantrips and slot-level spells that could plausibly be chosen (has
 * an attack roll or a saving throw), then lets that pure function decide
 * which to actually grant. Scoped to `characterClassSlug` — a subclass's own
 * slug is never a `spells.classes` entry upstream, and `applyClassTemplate`
 * already passes the base class slug here for exactly that reason.
 */
export const buildDefaultCharacterSpells = async (
  db: Database,
  characterClassSlug: string,
  casterType: string,
  spellSlotLevels: readonly number[],
): Promise<CharacterSpellInput[]> => {
  if (!CASTER_TYPES_WITH_SPELLS.includes(casterType)) return [];

  const levels = [0, ...new Set(spellSlotLevels)];

  const rows = await db
    .select({
      slug: spells.slug,
      name: spells.name,
      level: spells.level,
      attackRoll: spells.attackRoll,
      savingThrowAbility: spells.savingThrowAbility,
    })
    .from(spells)
    .where(
      and(
        inArray(spells.level, levels),
        // `classes` is a JSON array; SQLite has no array containment
        // operator, so membership is tested with json_each — the same
        // approach `library.listSpells` already uses for its class filter.
        sql`exists (select 1 from json_each(${spells.classes}) where json_each.value = ${characterClassSlug})`,
        or(eq(spells.attackRoll, true), isNotNull(spells.savingThrowAbility)),
      ),
    );

  return selectDefaultCharacterSpells(rows, spellSlotLevels);
};
