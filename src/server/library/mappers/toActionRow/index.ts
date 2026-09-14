import type { CreatureActionFixture } from '~/server/library/fixtures';
import type { NewCreatureAction } from '~/server/db/schema';
import { parseCreatureActionSaveArea } from '~/server/library/parseCreatureActionSaveArea';

/** `order_in_statblock` becomes `sortOrder` — `order` is a reserved word.
 * Save/area data has no structured upstream field, so it is backfilled by
 * parsing `desc`'s prose — see `parseCreatureActionSaveArea`. */
export const toActionRow = (
  fixture: CreatureActionFixture,
): NewCreatureAction => ({
  slug: fixture.pk,
  creatureSlug: fixture.fields.parent,
  name: fixture.fields.name,
  desc: fixture.fields.desc,
  actionType: fixture.fields.action_type,
  sortOrder: fixture.fields.order_in_statblock,
  legendaryActionCost: fixture.fields.legendary_action_cost,
  usesType: fixture.fields.uses_type,
  usesParam: fixture.fields.uses_param,
  ...parseCreatureActionSaveArea(fixture.fields.desc),
});
