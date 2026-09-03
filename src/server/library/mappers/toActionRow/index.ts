import type { CreatureActionFixture } from '~/server/library/fixtures';
import type { NewCreatureAction } from '~/server/db/schema';

/** `order_in_statblock` becomes `sortOrder` — `order` is a reserved word. */
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
});
