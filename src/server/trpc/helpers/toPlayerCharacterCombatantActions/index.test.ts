import { describe, expect, it } from 'vitest';
import { toPlayerCharacterCombatantActions } from '~/server/trpc/helpers/toPlayerCharacterCombatantActions';
import type {
  PlayerCharacterAction,
  PlayerCharacterActionAttack,
} from '~/server/db/schema';

const baseAction: PlayerCharacterAction = {
  id: 'action-1',
  playerCharacterId: 'pc-1',
  name: 'Longsword',
  desc: 'A melee weapon attack.',
  actionType: 'ACTION',
  sortOrder: 0,
  legendaryActionCost: null,
  usesType: null,
  usesParam: null,
  saveAbility: null,
  saveDc: null,
  areaType: null,
  areaSize: null,
  areaSizeUnit: null,
  damageOnFailRoll: null,
  damageOnFailType: null,
  halfDamageOnSave: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  version: 1,
  updatedBy: 'local',
};

const baseAttack: PlayerCharacterActionAttack = {
  id: 'attack-1',
  playerCharacterActionId: 'action-1',
  name: 'Longsword',
  attackType: 'Melee Weapon Attack',
  toHitMod: 5,
  reach: 5,
  range: null,
  longRange: null,
  targetCreatureOnly: false,
  damageDieCount: 1,
  damageDieType: 'd8',
  damageBonus: 3,
  damageType: 'slashing',
  extraDamageDieCount: null,
  extraDamageDieType: null,
  extraDamageBonus: null,
  extraDamageType: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  version: 1,
  updatedBy: 'local',
};

describe('toPlayerCharacterCombatantActions', () => {
  it('aliases the row id to slug and preserves statblock-source fields', () => {
    const [result] = toPlayerCharacterCombatantActions([baseAction], []);

    expect(result).toMatchObject({
      slug: 'action-1',
      name: 'Longsword',
      desc: 'A melee weapon attack.',
      actionType: 'ACTION',
      sortOrder: 0,
      legendaryActionCost: null,
      attack: null,
    });
  });

  it('attaches the matching attack by parent action id', () => {
    const [result] = toPlayerCharacterCombatantActions(
      [baseAction],
      [baseAttack],
    );

    expect(result?.attack).toEqual(baseAttack);
  });

  it('leaves attack null when no attack references the action', () => {
    const otherAttack = { ...baseAttack, playerCharacterActionId: 'other' };
    const [result] = toPlayerCharacterCombatantActions(
      [baseAction],
      [otherAttack],
    );

    expect(result?.attack).toBeNull();
  });
});
