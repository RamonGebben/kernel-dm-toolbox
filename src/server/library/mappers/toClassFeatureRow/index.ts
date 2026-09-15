import type { ClassFeatureFixture } from '~/server/library/fixtures';
import type { NewCharacterClassFeature } from '~/server/db/schema';

export const toClassFeatureRow = (
  fixture: ClassFeatureFixture,
): NewCharacterClassFeature => ({
  slug: fixture.pk,
  classSlug: fixture.fields.parent,
  name: fixture.fields.name,
  desc: fixture.fields.desc,
});
