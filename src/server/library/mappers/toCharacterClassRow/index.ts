import type { CharacterClassFixture } from '~/server/library/fixtures';
import type { NewCharacterClass } from '~/server/db/schema';

export const toCharacterClassRow = (
  fixture: CharacterClassFixture,
): NewCharacterClass => ({
  slug: fixture.pk,
  document: fixture.fields.document,
  name: fixture.fields.name,
  desc: fixture.fields.desc,
  hitDice: fixture.fields.hit_dice,
  casterType: fixture.fields.caster_type,
  primaryAbilities: fixture.fields.primary_abilities,
  savingThrows: fixture.fields.saving_throws,
  subclassOfSlug: fixture.fields.subclass_of,
});
