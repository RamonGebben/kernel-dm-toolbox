import type {
  CustomCreature,
  CustomCreatureAction,
  CustomCreatureTrait,
} from '~/server/db/schema';
import type {
  StatblockSourceAction,
  StatblockSourceCreature,
  StatblockSourceTrait,
} from '~/server/trpc/helpers/buildStatblock';

type ToCustomCreatureStatblockSourceArgs = {
  customCreature: CustomCreature;
  traits: readonly CustomCreatureTrait[];
  actions: readonly CustomCreatureAction[];
};

type CustomCreatureStatblockSource = {
  creature: StatblockSourceCreature;
  traits: StatblockSourceTrait[];
  actions: StatblockSourceAction[];
};

/**
 * Adapts a `custom_creatures` row (+ its traits/actions) into the exact shape
 * `buildStatblock` reads off a library `Creature` — aliasing `id` to `slug`,
 * the one field name that differs between the two tables. Every other column
 * on `custom_creatures` was deliberately named to match `creatures` (see the
 * schema comment), so no other translation is needed.
 */
export const toCustomCreatureStatblockSource = ({
  customCreature,
  traits,
  actions,
}: ToCustomCreatureStatblockSourceArgs): CustomCreatureStatblockSource => ({
  creature: { ...customCreature, slug: customCreature.id },
  traits: traits.map(trait => ({
    slug: trait.id,
    name: trait.name,
    desc: trait.desc,
  })),
  actions: actions.map(action => ({
    slug: action.id,
    name: action.name,
    desc: action.desc,
    actionType: action.actionType,
    sortOrder: action.sortOrder,
    legendaryActionCost: action.legendaryActionCost,
  })),
});
