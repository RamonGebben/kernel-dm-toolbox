import type {
  EngineAbilityModifiers,
  EngineCombatant,
} from '~/server/simulator/engine/types';

const ZERO_MODIFIERS: EngineAbilityModifiers = {
  strength: 0,
  dexterity: 0,
  constitution: 0,
  intelligence: 0,
  wisdom: 0,
  charisma: 0,
};

/** A minimal, fully-specified combatant for engine unit tests — every field
 * has a sane default so a test only overrides what it actually cares about. */
export const buildCombatant = (
  overrides: Partial<EngineCombatant> = {},
): EngineCombatant => ({
  id: overrides.id ?? crypto.randomUUID(),
  templateKey: overrides.templateKey ?? 'template',
  name: overrides.name ?? 'Test Combatant',
  side: overrides.side ?? 'party',
  armorClass: overrides.armorClass ?? 10,
  maxHitPoints: overrides.maxHitPoints ?? 20,
  currentHitPoints: overrides.currentHitPoints ?? 20,
  initiativeBonus: overrides.initiativeBonus ?? 0,
  speed: overrides.speed ?? 30,
  position: overrides.position ?? { x: 0, y: 0 },
  actions: overrides.actions ?? [],
  attacksPerTurn: overrides.attacksPerTurn ?? 1,
  saveModifiers: overrides.saveModifiers ?? ZERO_MODIFIERS,
  legendaryResistancesRemaining: overrides.legendaryResistancesRemaining ?? 0,
  legendaryActionPoints: overrides.legendaryActionPoints ?? 0,
  damageResistances: overrides.damageResistances ?? [],
  damageImmunities: overrides.damageImmunities ?? [],
  damageVulnerabilities: overrides.damageVulnerabilities ?? [],
});
