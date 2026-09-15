import { describe, expect, it } from 'vitest';
import { spendLegendaryAction } from '~/server/simulator/engine/legendaryActions';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type { EngineAction } from '~/server/simulator/engine/types';

const tailAttack: EngineAction = {
  id: 'tail-1',
  name: 'Tail Attack',
  actionType: 'LEGENDARY_ACTION',
  legendaryActionCost: 1,
  attack: {
    toHitMod: 8,
    reach: 15,
    range: null,
    damageDieCount: 2,
    damageDieType: 8,
    damageBonus: 5,
    damageType: 'bludgeoning',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

const wingAttack: EngineAction = {
  ...tailAttack,
  id: 'wing-1',
  name: 'Wing Attack',
  legendaryActionCost: 2,
};

describe('spendLegendaryAction', () => {
  it('returns null when the combatant has no legendary action points', () => {
    const self = buildCombatant({
      actions: [tailAttack],
      legendaryActionPoints: 0,
    });
    const enemy = buildCombatant({ id: 'enemy', position: { x: 1, y: 0 } });

    expect(spendLegendaryAction(self, [enemy], new Set(['tail-1']))).toBeNull();
  });

  it('returns null once the combatant is defeated', () => {
    const self = buildCombatant({
      actions: [tailAttack],
      legendaryActionPoints: 3,
      currentHitPoints: 0,
    });
    const enemy = buildCombatant({ id: 'enemy', position: { x: 1, y: 0 } });

    expect(spendLegendaryAction(self, [enemy], new Set(['tail-1']))).toBeNull();
  });

  it('prefers the most expensive affordable legendary action', () => {
    const self = buildCombatant({
      position: { x: 0, y: 0 },
      actions: [tailAttack, wingAttack],
      legendaryActionPoints: 3,
    });
    const enemy = buildCombatant({ id: 'enemy', position: { x: 1, y: 0 } });

    const spend = spendLegendaryAction(
      self,
      [enemy],
      new Set(['tail-1', 'wing-1']),
    );

    expect(spend?.choice.action.id).toBe('wing-1');
    expect(spend?.cost).toBe(2);
  });

  it('falls back to a cheaper action when the expensive one has no target in range', () => {
    const meleeOnly: EngineAction = {
      ...wingAttack,
      attack: { ...wingAttack.attack!, reach: 5, range: null },
    };
    const self = buildCombatant({
      position: { x: 0, y: 0 },
      actions: [tailAttack, meleeOnly],
      legendaryActionPoints: 3,
    });
    const farEnemy = buildCombatant({ id: 'far', position: { x: 3, y: 0 } });

    const spend = spendLegendaryAction(
      self,
      [farEnemy],
      new Set(['tail-1', 'wing-1']),
    );

    expect(spend?.choice.action.id).toBe('tail-1');
  });

  it('is gated by availableActionIds', () => {
    const self = buildCombatant({
      position: { x: 0, y: 0 },
      actions: [tailAttack],
      legendaryActionPoints: 3,
    });
    const enemy = buildCombatant({ id: 'enemy', position: { x: 1, y: 0 } });

    expect(spendLegendaryAction(self, [enemy], new Set())).toBeNull();
  });
});
