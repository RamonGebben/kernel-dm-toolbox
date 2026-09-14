import { describe, expect, it } from 'vitest';
import { selectAction } from '~/server/simulator/engine/selectAction';
import { buildCombatant } from '~/server/simulator/engine/testFixtures';
import type { EngineAction } from '~/server/simulator/engine/types';

const meleeAttack: EngineAction = {
  id: 'attack-1',
  name: 'Shortsword',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: {
    toHitMod: 4,
    reach: 5,
    range: null,
    damageDieCount: 1,
    damageDieType: 6,
    damageBonus: 2,
    damageType: 'piercing',
    extraDamageDieCount: 0,
    extraDamageDieType: 0,
    extraDamageBonus: 0,
    extraDamageType: null,
  },
  save: null,
  maxUsesPerEncounter: null,
};

const breathWeapon: EngineAction = {
  id: 'breath-1',
  name: 'Acid Breath',
  actionType: 'ACTION',
  legendaryActionCost: null,
  attack: null,
  save: {
    saveAbility: 'dexterity',
    saveDc: 15,
    areaType: 'line',
    areaSize: 30,
    damageOnFailRoll: '10d6',
    damageOnFailType: 'acid',
    halfDamageOnSave: true,
  },
  maxUsesPerEncounter: 1,
};

describe('selectAction', () => {
  it('returns null when there are no living enemies', () => {
    const self = buildCombatant({ actions: [meleeAttack] });
    const deadEnemy = buildCombatant({ currentHitPoints: 0 });

    expect(selectAction(self, [deadEnemy], new Set(['attack-1']))).toBeNull();
  });

  it('targets the nearest living enemy in range with an attack', () => {
    const self = buildCombatant({
      position: { x: 0, y: 0 },
      actions: [meleeAttack],
    });
    const near = buildCombatant({ id: 'near', position: { x: 1, y: 0 } });
    const far = buildCombatant({ id: 'far', position: { x: 10, y: 0 } });

    const choice = selectAction(self, [far, near], new Set(['attack-1']));

    expect(choice?.action.id).toBe('attack-1');
    expect(choice?.target.id).toBe('near');
    expect(choice?.affected.map(c => c.id)).toEqual(['near']);
  });

  it('gates an action by availableActionIds', () => {
    const self = buildCombatant({
      position: { x: 0, y: 0 },
      actions: [meleeAttack],
    });
    const near = buildCombatant({ id: 'near', position: { x: 1, y: 0 } });

    expect(selectAction(self, [near], new Set())).toBeNull();
  });

  it('prefers an AoE save action when it would hit 2+ enemies', () => {
    const self = buildCombatant({
      position: { x: 0, y: 0 },
      actions: [meleeAttack, breathWeapon],
    });
    const enemyA = buildCombatant({ id: 'a', position: { x: 1, y: 0 } });
    const enemyB = buildCombatant({ id: 'b', position: { x: 2, y: 0 } });

    const choice = selectAction(
      self,
      [enemyA, enemyB],
      new Set(['attack-1', 'breath-1']),
    );

    expect(choice?.action.id).toBe('breath-1');
    expect(choice?.affected.map(c => c.id).sort()).toEqual(['a', 'b']);
  });

  it('falls back to a single-target attack when the AoE would only hit one enemy', () => {
    const self = buildCombatant({
      position: { x: 0, y: 0 },
      actions: [meleeAttack, breathWeapon],
    });
    const enemy = buildCombatant({ id: 'solo', position: { x: 1, y: 0 } });

    const choice = selectAction(
      self,
      [enemy],
      new Set(['attack-1', 'breath-1']),
    );

    expect(choice?.action.id).toBe('attack-1');
  });

  it('returns null when nothing is in range and nothing else is usable', () => {
    const self = buildCombatant({
      position: { x: 0, y: 0 },
      actions: [meleeAttack],
    });
    const farEnemy = buildCombatant({ id: 'far', position: { x: 10, y: 10 } });

    expect(selectAction(self, [farEnemy], new Set(['attack-1']))).toBeNull();
  });
});
