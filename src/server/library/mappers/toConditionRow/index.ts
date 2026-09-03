import type { ConditionFixture } from '~/server/library/fixtures';
import type { NewCondition } from '~/server/db/schema';
import { slugToTitle } from '~/utils/slugToTitle';

/**
 * Upstream supplies no display name for a condition — only the slug it
 * `describes` — so the name is derived here rather than hard-coded, which
 * keeps the fifteen conditions in step with the source if it ever grows.
 */
export const toConditionRow = (fixture: ConditionFixture): NewCondition => ({
  slug: fixture.pk,
  key: fixture.fields.describes,
  name: slugToTitle(fixture.fields.describes),
  desc: fixture.fields.desc,
});
