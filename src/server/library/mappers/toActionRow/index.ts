import type { CreatureActionFixture } from '~/server/library/fixtures';
import type { NewCreatureAction } from '~/server/db/schema';
import { parseCreatureActionSaveArea } from '~/server/library/parseCreatureActionSaveArea';
import { parseConditionApplication } from '~/server/library/parseConditionApplication';
import { parseMultiattackSequence } from '~/server/library/parseMultiattackSequence';

/** `order_in_statblock` becomes `sortOrder` — `order` is a reserved word.
 * Save/area data, condition application, and a "Multiattack" action's own
 * attack sequence have no structured upstream field, so they are backfilled
 * by parsing `desc`'s prose — see `parseCreatureActionSaveArea`,
 * `parseConditionApplication`, and `parseMultiattackSequence`.
 *
 * `conditionSlugByKey` is the already-imported `conditions` list, keyed by
 * `conditions.key` (the lowercase word `parseConditionApplication` returns)
 * — resolving a key to its full `conditions.slug` is the caller's job since
 * a pure parser has no DB access. */
export const toActionRow = (
  fixture: CreatureActionFixture,
  conditionSlugByKey: ReadonlyMap<string, string>,
): NewCreatureAction => {
  const { appliesConditionKey, ...conditionApplication } =
    parseConditionApplication(fixture.fields.desc);

  return {
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
    ...conditionApplication,
    appliesConditionSlug: appliesConditionKey
      ? (conditionSlugByKey.get(appliesConditionKey) ?? null)
      : null,
    multiattackSequence: parseMultiattackSequence(fixture.fields.desc),
  };
};
