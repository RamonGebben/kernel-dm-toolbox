import { describe, expect, it } from 'vitest';
import { parseCreatureActionSaveArea } from '~/server/library/parseCreatureActionSaveArea';

describe('parseCreatureActionSaveArea', () => {
  it('parses a line breath weapon', () => {
    const result = parseCreatureActionSaveArea(
      'Dexterity Saving Throw: DC 18, each creature in a 60-foot-long, 5-foot-wide Line. Failure: 54 (12d8) Acid damage. Success: Half damage.',
    );

    expect(result).toEqual({
      saveAbility: 'dexterity',
      saveDc: 18,
      areaType: 'line',
      areaSize: 60,
      areaSizeUnit: 'feet',
      damageOnFailRoll: '12d8',
      damageOnFailType: 'acid',
      halfDamageOnSave: true,
    });
  });

  it('parses a cone breath weapon', () => {
    const result = parseCreatureActionSaveArea(
      'Constitution Saving Throw: DC 18, each creature in a 60-foot Cone. Failure: 56 (16d6) Poison damage. Success: Half damage.',
    );

    expect(result.areaType).toBe('cone');
    expect(result.areaSize).toBe(60);
    expect(result.damageOnFailRoll).toBe('16d6');
    expect(result.damageOnFailType).toBe('poison');
  });

  it('maps an emanation to a sphere centered on the creature', () => {
    const result = parseCreatureActionSaveArea(
      'Wisdom Saving Throw: DC 12, each creature in a 15-foot Emanation originating from the doppelganger that can see the doppelganger. Failure: The target has the Frightened condition…',
    );

    expect(result.saveAbility).toBe('wisdom');
    expect(result.saveDc).toBe(12);
    expect(result.areaType).toBe('sphere');
    expect(result.areaSize).toBe(15);
    expect(result.damageOnFailRoll).toBeNull();
    expect(result.halfDamageOnSave).toBe(false);
  });

  it('leaves area null for a single-target save', () => {
    const result = parseCreatureActionSaveArea(
      'Intelligence Saving Throw: DC 16, one creature within 30 feet that is Charmed or Grappled by the aboleth. Failure: 10 (3d6) Psychic damage. Success: Half damage.',
    );

    expect(result.saveAbility).toBe('intelligence');
    expect(result.saveDc).toBe(16);
    expect(result.areaType).toBeNull();
    expect(result.areaSize).toBeNull();
    expect(result.damageOnFailRoll).toBe('3d6');
    expect(result.damageOnFailType).toBe('psychic');
    expect(result.halfDamageOnSave).toBe(true);
  });

  it('returns nulls for a save with no numeric damage', () => {
    const result = parseCreatureActionSaveArea(
      'Strength Saving Throw: DC 19, each creature in a 30-foot Cone. Failure: The target is pushed up to 60 feet straight away from the dragon and has the Prone condition.',
    );

    expect(result.saveAbility).toBe('strength');
    expect(result.saveDc).toBe(19);
    expect(result.areaType).toBe('cone');
    expect(result.damageOnFailRoll).toBeNull();
    expect(result.damageOnFailType).toBeNull();
    expect(result.halfDamageOnSave).toBe(false);
  });

  it('returns an all-null result for prose with no saving throw at all', () => {
    const result = parseCreatureActionSaveArea(
      'The dragon makes three Rend attacks. It can replace one attack with a use of (A) Sleep Breath or (B) Spellcasting to cast Scorching Ray.',
    );

    expect(result).toEqual({
      saveAbility: null,
      saveDc: null,
      areaType: null,
      areaSize: null,
      areaSizeUnit: null,
      damageOnFailRoll: null,
      damageOnFailType: null,
      halfDamageOnSave: true,
    });
  });

  it('degrades gracefully on a truncated/ellipsized description', () => {
    const result = parseCreatureActionSaveArea(
      'Intelligence Saving Throw: DC 16…',
    );

    expect(result.saveAbility).toBe('intelligence');
    expect(result.saveDc).toBe(16);
    expect(result.areaType).toBeNull();
    expect(result.damageOnFailRoll).toBeNull();
  });
});
