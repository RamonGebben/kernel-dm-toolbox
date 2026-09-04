import type { SpellCastingOptionFixture } from '~/server/library/fixtures';
import type { NewSpellCastingOption } from '~/server/db/schema';

/**
 * The upstream pk is an integer, already coerced to a string by the fixture
 * schema, so every library table in this app has a text primary key.
 */
export const toSpellCastingOptionRow = (
  fixture: SpellCastingOptionFixture,
): NewSpellCastingOption => ({
  id: fixture.pk,
  spellSlug: fixture.fields.parent,
  type: fixture.fields.type,
  desc: fixture.fields.desc,
  damageRoll: fixture.fields.damage_roll,
  duration: fixture.fields.duration,
  range: fixture.fields.range,
  targetCount: fixture.fields.target_count,
  shapeSize: fixture.fields.shape_size,
  concentration: fixture.fields.concentration,
});
