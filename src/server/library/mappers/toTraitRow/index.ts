import type { CreatureTraitFixture } from '~/server/library/fixtures';
import type { NewCreatureTrait } from '~/server/db/schema';

export const toTraitRow = (
  fixture: CreatureTraitFixture,
): NewCreatureTrait => ({
  slug: fixture.pk,
  creatureSlug: fixture.fields.parent,
  name: fixture.fields.name,
  desc: fixture.fields.desc,
  type: fixture.fields.type,
});
