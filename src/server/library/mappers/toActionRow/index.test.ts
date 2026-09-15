import { describe, expect, it } from 'vitest';
import { toActionRow } from '~/server/library/mappers/toActionRow';
import { creatureActionFixtureSchema } from '~/server/library/fixtures';

const NO_CONDITIONS = new Map<string, string>();

const consumeMemories = creatureActionFixtureSchema.parse({
  model: 'api_v2.creatureaction',
  pk: 'srd-2024_aboleth_consume-memories',
  fields: {
    name: 'Consume Memories',
    desc: 'Intelligence Saving Throw: DC 16…',
    parent: 'srd-2024_aboleth',
    action_type: 'ACTION',
    order_in_statblock: 2,
  },
});

describe('toActionRow', () => {
  it('links the action to its creature through parent', () => {
    expect(toActionRow(consumeMemories, NO_CONDITIONS).creatureSlug).toBe(
      'srd-2024_aboleth',
    );
  });

  it('renames order_in_statblock to sortOrder, avoiding the reserved word', () => {
    expect(toActionRow(consumeMemories, NO_CONDITIONS).sortOrder).toBe(2);
  });

  it('preserves the action type that groups the statblock', () => {
    expect(toActionRow(consumeMemories, NO_CONDITIONS).actionType).toBe(
      'ACTION',
    );
  });

  it('carries the legendary action cost when there is one', () => {
    const legendary = creatureActionFixtureSchema.parse({
      ...consumeMemories,
      pk: 'srd-2024_aboleth_lash',
      fields: {
        ...consumeMemories.fields,
        action_type: 'LEGENDARY_ACTION',
        legendary_action_cost: 2,
      },
    });

    expect(toActionRow(legendary, NO_CONDITIONS).legendaryActionCost).toBe(2);
  });

  it('backfills save/area data by parsing desc', () => {
    expect(toActionRow(consumeMemories, NO_CONDITIONS).saveAbility).toBe(
      'intelligence',
    );
    expect(toActionRow(consumeMemories, NO_CONDITIONS).saveDc).toBe(16);
  });

  it('leaves save/area data and multiattackSequence null for an action with no saving throw or multiattack', () => {
    const basicAttack = creatureActionFixtureSchema.parse({
      ...consumeMemories,
      pk: 'srd-2024_aboleth_tentacle',
      fields: {
        ...consumeMemories.fields,
        name: 'Tentacle',
        desc: 'Melee Attack Roll: +9, reach 10 ft. 16 (2d10 + 5) Bludgeoning damage.',
      },
    });

    expect(toActionRow(basicAttack, NO_CONDITIONS).saveAbility).toBeNull();
    expect(toActionRow(basicAttack, NO_CONDITIONS).areaType).toBeNull();
    expect(
      toActionRow(basicAttack, NO_CONDITIONS).multiattackSequence,
    ).toBeNull();
  });

  it('backfills multiattackSequence for a Multiattack action', () => {
    const multiattack = creatureActionFixtureSchema.parse({
      ...consumeMemories,
      pk: 'srd-2024_aboleth_multiattack',
      fields: {
        ...consumeMemories.fields,
        name: 'Multiattack',
        desc: 'The aboleth makes three Tentacle attacks.',
      },
    });

    expect(
      toActionRow(multiattack, NO_CONDITIONS).multiattackSequence,
    ).toEqual([{ actionName: 'Tentacle', count: 3 }]);
  });

  it('resolves appliesConditionSlug through the passed-in condition lookup', () => {
    const stun = creatureActionFixtureSchema.parse({
      ...consumeMemories,
      pk: 'srd-2024_otyugh_tentacle-slam',
      fields: {
        ...consumeMemories.fields,
        name: 'Tentacle Slam',
        desc: 'Constitution Saving Throw: DC 14, each creature Grappled by the otyugh. Failure: 16 (3d8 + 3) Bludgeoning damage, and the target has the Stunned condition until the start of the otyugh’s next turn. Success: Half damage only.',
      },
    });

    const conditionSlugByKey = new Map([['stunned', 'srd-2024_stunned']]);

    const row = toActionRow(stun, conditionSlugByKey);
    expect(row.appliesConditionSlug).toBe('srd-2024_stunned');
    expect(row.conditionDurationRounds).toBe(1);
  });

  it('leaves appliesConditionSlug null when the parsed key has no matching condition row', () => {
    const stun = creatureActionFixtureSchema.parse({
      ...consumeMemories,
      pk: 'srd-2024_otyugh_tentacle-slam',
      fields: {
        ...consumeMemories.fields,
        name: 'Tentacle Slam',
        desc: 'The target has the Stunned condition until the start of the otyugh’s next turn.',
      },
    });

    expect(toActionRow(stun, NO_CONDITIONS).appliesConditionSlug).toBeNull();
  });
});
