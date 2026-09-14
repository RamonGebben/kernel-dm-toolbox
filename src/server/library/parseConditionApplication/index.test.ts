import { describe, expect, it } from 'vitest';
import { parseConditionApplication } from '~/server/library/parseConditionApplication';

describe('parseConditionApplication', () => {
  it('parses a fixed one-round duration ("until the start of its next turn")', () => {
    expect(
      parseConditionApplication(
        "Melee Attack Roll: +7, reach 5 ft. 7 (1d6 + 4) Piercing damage plus 17 (5d6) Poison damage, and the target has the Poisoned condition until the start of the assassin's next turn.",
      ),
    ).toEqual({
      appliesConditionKey: 'poisoned',
      conditionDurationRounds: 1,
      conditionSaveEndsEachTurn: false,
    });
  });

  it('parses a repeat-save-to-end condition, timing clause after "repeats the save"', () => {
    expect(
      parseConditionApplication(
        'Constitution Saving Throw: DC 15, each creature in a 20-foot Emanation originating from the vrock (demons succeed automatically). Failure: 10 (3d6) Thunder damage, and the target has the Stunned condition until the end of the vrock\'s next turn.',
      ),
    ).toEqual({
      appliesConditionKey: 'stunned',
      conditionDurationRounds: 1,
      conditionSaveEndsEachTurn: false,
    });
  });

  it('parses a repeat-save-to-end condition, timing clause before "repeats the save" (spell phrasing)', () => {
    expect(
      parseConditionApplication(
        'Choose a Humanoid that you can see within range. The target must succeed on a Wisdom saving throw or have the Paralyzed condition for the duration. At the end of each of its turns, the target repeats the save, ending the spell on itself on a success.',
      ),
    ).toEqual({
      appliesConditionKey: 'paralyzed',
      conditionDurationRounds: null,
      conditionSaveEndsEachTurn: true,
    });
  });

  it('parses a repeat-save-to-end condition, timing clause after (monster phrasing)', () => {
    expect(
      parseConditionApplication(
        'Wisdom Saving Throw: DC 12, each creature in a 15-foot Emanation originating from the doppelganger that can see the doppelganger. Failure: The target has the Frightened condition and repeats the save at the end of each of its turns, ending the effect on itself on a success. After 1 minute, it succeeds automatically.',
      ),
    ).toEqual({
      appliesConditionKey: 'frightened',
      conditionDurationRounds: 10,
      conditionSaveEndsEachTurn: true,
    });
  });

  it('parses "gives it the X condition" phrasing', () => {
    expect(
      parseConditionApplication(
        'Melee Attack Roll: +5, reach 5 ft. 10 (2d6 + 3) Bludgeoning damage. If the target is a Medium or smaller creature, the rug can give it the Grappled condition (escape DC 13) instead of dealing damage.',
      ),
    ).toEqual({
      appliesConditionKey: 'grappled',
      conditionDurationRounds: null,
      conditionSaveEndsEachTurn: false,
    });
  });

  it('returns the empty result for a two-stage escalating effect ("First Failure"/"Second Failure")', () => {
    expect(
      parseConditionApplication(
        'Constitution Saving Throw: DC 20, each creature in a 60-foot Cone. First Failure The target has the Incapacitated condition until the end of its next turn, when it repeats the save. Second Failure The target has the Paralyzed condition, and it repeats the save at the end of each of its turns, ending the effect on itself on a success. After 1 minute, it succeeds automatically.',
      ),
    ).toEqual({
      appliesConditionKey: null,
      conditionDurationRounds: null,
      conditionSaveEndsEachTurn: false,
    });
  });

  it('returns the empty result when more than one distinct condition is mentioned without "First/Second Failure" wording', () => {
    expect(
      parseConditionApplication(
        'Each creature must succeed on a Wisdom saving throw or have the Incapacitated condition until the end of its next turn, at which point it must repeat the save. If the target fails the second save, the target has the Unconscious condition for the duration.',
      ),
    ).toEqual({
      appliesConditionKey: null,
      conditionDurationRounds: null,
      conditionSaveEndsEachTurn: false,
    });
  });

  it('returns the empty result when no condition is applied', () => {
    expect(
      parseConditionApplication(
        'Melee Attack Roll: +7, reach 5 ft. 7 (1d6 + 4) Piercing damage.',
      ),
    ).toEqual({
      appliesConditionKey: null,
      conditionDurationRounds: null,
      conditionSaveEndsEachTurn: false,
    });
  });

  it('does not treat a condition named only as a prerequisite as being applied', () => {
    expect(
      parseConditionApplication(
        'Intelligence Saving Throw: DC 16, one creature within 30 feet that is Charmed or Grappled by the aboleth. Failure: 10 (3d6) Psychic damage.',
      ),
    ).toEqual({
      appliesConditionKey: null,
      conditionDurationRounds: null,
      conditionSaveEndsEachTurn: false,
    });
  });

  it('leaves an indefinite, non-repeat-save duration with no fixed round count', () => {
    expect(
      parseConditionApplication(
        "You conjure a mass of sticky webbing. A creature must succeed on a Dexterity saving throw or have the Restrained condition while in the webs or until it breaks free. A creature Restrained by the webs can take an action to make a Strength (Athletics) check against your spell save DC.",
      ),
    ).toEqual({
      appliesConditionKey: 'restrained',
      conditionDurationRounds: null,
      conditionSaveEndsEachTurn: false,
    });
  });
});
