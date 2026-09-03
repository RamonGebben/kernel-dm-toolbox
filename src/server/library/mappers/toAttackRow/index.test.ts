import { describe, expect, it } from 'vitest';
import { toAttackRow } from '~/server/library/mappers/toAttackRow';
import { creatureActionAttackFixtureSchema } from '~/server/library/fixtures';

const tentacle = creatureActionAttackFixtureSchema.parse({
  model: 'api_v2.creatureactionattack',
  pk: 'srd-2024_aboleth_tentacle_tentacle-attack',
  fields: {
    name: 'Tentacle attack',
    parent: 'srd-2024_aboleth_tentacle',
    attack_type: 'WEAPON',
    to_hit_mod: 9,
    reach: 15,
    damage_die_count: 2,
    damage_die_type: 'D6',
    damage_bonus: 5,
    extra_damage_type: 'bludgeoning',
    target_creature_only: false,
  },
});

describe('toAttackRow', () => {
  it('links to its action, not to the creature', () => {
    expect(toAttackRow(tentacle).actionSlug).toBe('srd-2024_aboleth_tentacle');
  });

  it('keeps the attack roll intact', () => {
    const row = toAttackRow(tentacle);

    expect(row.toHitMod).toBe(9);
    expect(row.reach).toBe(15);
  });

  it('keeps the damage dice as separate parts rather than a string', () => {
    const row = toAttackRow(tentacle);

    expect(row.damageDieCount).toBe(2);
    expect(row.damageDieType).toBe('D6');
    expect(row.damageBonus).toBe(5);
  });

  it('nulls ranged fields for a melee attack', () => {
    const row = toAttackRow(tentacle);

    expect(row.range).toBeNull();
    expect(row.longRange).toBeNull();
  });
});
