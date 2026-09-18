import { describe, expect, it } from 'vitest';
import { toActionRow } from '~/server/library/mappers/toActionRow';
import { creatureActionFixtureSchema } from '~/server/library/fixtures';

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
    expect(toActionRow(consumeMemories).creatureSlug).toBe('srd-2024_aboleth');
  });

  it('renames order_in_statblock to sortOrder, avoiding the reserved word', () => {
    expect(toActionRow(consumeMemories).sortOrder).toBe(2);
  });

  it('preserves the action type that groups the statblock', () => {
    expect(toActionRow(consumeMemories).actionType).toBe('ACTION');
  });

  it('treats an explicit null order_in_statblock as 0, not just an omitted field', () => {
    const noOrder = creatureActionFixtureSchema.parse({
      ...consumeMemories,
      pk: 'green-ronin_tdcs_some-action',
      fields: {
        ...consumeMemories.fields,
        order_in_statblock: null,
      },
    });

    expect(toActionRow(noOrder).sortOrder).toBe(0);
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

    expect(toActionRow(legendary).legendaryActionCost).toBe(2);
  });
});
