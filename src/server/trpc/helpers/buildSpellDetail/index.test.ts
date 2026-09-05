import { describe, expect, it } from 'vitest';
import {
  buildCastingOptionLabel,
  buildCastingOptions,
  buildCastingTimeLabel,
  buildClassLabels,
  buildComponentsLabel,
  buildDurationLabel,
  buildRangeLabel,
  buildSavingThrowLabel,
  buildShapeLabel,
  buildSpellDetail,
  buildSubtitle,
  buildTargetLabel,
} from '~/server/trpc/helpers/buildSpellDetail';
import type { Spell, SpellCastingOption } from '~/server/db/schema';

const fireball: Spell = {
  slug: 'srd-2024_fireball',
  document: 'srd-2024',
  name: 'Fireball',
  desc: 'A bright streak flashes from your pointing finger to a point you choose.',
  level: 3,
  school: 'evocation',
  higherLevel: 'The damage increases by 1d6 for each slot level above 3rd.',
  targetType: 'area',
  rangeText: '150 feet',
  range: 150,
  rangeUnit: 'feet',
  targetCount: 1,
  castingTime: 'action',
  reactionCondition: null,
  ritual: false,
  concentration: false,
  duration: 'instantaneous',
  verbal: true,
  somatic: true,
  material: true,
  materialSpecified: 'a tiny ball of bat guano and sulfur',
  materialConsumed: true,
  savingThrowAbility: 'dexterity',
  attackRoll: false,
  damageRoll: '8d6',
  damageTypes: ['fire'],
  shapeType: 'sphere',
  shapeSize: 20,
  shapeSizeUnit: 'feet',
  classes: ['srd-2024_sorcerer', 'srd-2024_wizard'],
};

const guidance: Spell = {
  ...fireball,
  slug: 'srd-2024_guidance',
  name: 'Guidance',
  level: 0,
  school: 'divination',
  concentration: true,
  duration: '1 minute',
  ritual: false,
  materialSpecified: null,
  material: false,
  materialConsumed: false,
  targetType: null,
  shapeType: null,
  shapeSize: null,
  savingThrowAbility: null,
  damageRoll: null,
  damageTypes: [],
  classes: [],
};

const higherSlot: SpellCastingOption = {
  id: 'opt-1',
  spellSlug: fireball.slug,
  type: 'slot_level_4',
  desc: null,
  damageRoll: '9d6',
  duration: null,
  range: null,
  targetCount: null,
  shapeSize: null,
  concentration: null,
};

describe('buildSubtitle', () => {
  it('reads as "1st-level School" for a leveled spell', () => {
    expect(buildSubtitle(fireball)).toBe('3rd-level Evocation');
  });

  it('reads as "School Cantrip" at level 0', () => {
    expect(buildSubtitle(guidance)).toBe('Divination Cantrip');
  });

  it('appends a ritual note', () => {
    expect(buildSubtitle({ ...fireball, ritual: true })).toBe(
      '3rd-level Evocation (ritual)',
    );
  });
});

describe('buildRangeLabel', () => {
  it('prefers the upstream prose', () => {
    expect(buildRangeLabel(fireball)).toBe('150 feet');
  });

  it('falls back to the numeric range and unit', () => {
    expect(buildRangeLabel({ ...fireball, rangeText: null })).toBe(
      '150 feet',
    );
  });

  it('falls back to Self when there is no range at all', () => {
    expect(
      buildRangeLabel({ ...fireball, rangeText: null, range: 0 }),
    ).toBe('Self');
  });
});

describe('buildComponentsLabel', () => {
  it('lists the letters present', () => {
    expect(buildComponentsLabel(fireball)).toBe(
      'V, S, M (a tiny ball of bat guano and sulfur, which the spell consumes)',
    );
  });

  it('omits the material parenthetical when nothing is specified', () => {
    expect(buildComponentsLabel(guidance)).toBe('V, S');
  });

  it('omits the consumed note when the material is not used up', () => {
    expect(
      buildComponentsLabel({ ...fireball, materialConsumed: false }),
    ).toBe('V, S, M (a tiny ball of bat guano and sulfur)');
  });
});

describe('buildDurationLabel', () => {
  it('prefixes Concentration when the spell requires it', () => {
    expect(buildDurationLabel(guidance)).toBe('Concentration, 1 minute');
  });

  it('capitalizes a non-concentration duration', () => {
    expect(buildDurationLabel(fireball)).toBe('Instantaneous');
  });

  it('does not double the prefix if upstream already includes it', () => {
    expect(
      buildDurationLabel({
        ...guidance,
        duration: 'concentration, up to 10 minutes',
      }),
    ).toBe('Concentration, up to 10 minutes');
  });
});

describe('buildCastingTimeLabel', () => {
  it('gives a plain action a count of one', () => {
    expect(buildCastingTimeLabel('action')).toBe('1 Action');
  });

  it('splits a hyphenated action type', () => {
    expect(buildCastingTimeLabel('bonus-action')).toBe('1 Bonus Action');
  });

  it('gives reaction a count of one too', () => {
    expect(buildCastingTimeLabel('reaction')).toBe('1 Reaction');
  });

  it('splits a pre-counted unit with no space', () => {
    expect(buildCastingTimeLabel('1minute')).toBe('1 Minute');
    expect(buildCastingTimeLabel('10minutes')).toBe('10 Minutes');
    expect(buildCastingTimeLabel('1hour')).toBe('1 Hour');
  });

  it('passes through anything it does not recognise', () => {
    expect(buildCastingTimeLabel('1 action')).toBe('1 action');
  });
});

describe('buildTargetLabel', () => {
  it('renders a single target with no count prefix', () => {
    expect(buildTargetLabel(fireball)).toBe('Area');
  });

  it('prefixes the count above one', () => {
    expect(buildTargetLabel({ ...fireball, targetCount: 3 })).toBe(
      '3 Area',
    );
  });

  it('is null when the spell has no target type', () => {
    expect(buildTargetLabel(guidance)).toBeNull();
  });
});

describe('buildShapeLabel', () => {
  it('combines size, unit and shape', () => {
    expect(buildShapeLabel(fireball)).toBe('20-feet Sphere');
  });

  it('is null when the spell has no shape', () => {
    expect(buildShapeLabel(guidance)).toBeNull();
  });
});

describe('buildSavingThrowLabel', () => {
  it('title-cases the ability and appends "save"', () => {
    expect(buildSavingThrowLabel(fireball)).toBe('Dexterity save');
  });

  it('is null when the spell allows no save', () => {
    expect(buildSavingThrowLabel(guidance)).toBeNull();
  });
});

describe('buildClassLabels', () => {
  it('strips the document prefix and title-cases, sorted', () => {
    expect(buildClassLabels(fireball)).toEqual(['Sorcerer', 'Wizard']);
  });

  it('is empty for a spell with no listed classes', () => {
    expect(buildClassLabels(guidance)).toEqual([]);
  });
});

describe('buildCastingOptionLabel', () => {
  it('renders a slot level as an ordinal', () => {
    expect(buildCastingOptionLabel('slot_level_4')).toBe('4th-level Slot');
  });

  it('falls back to a title case for anything else', () => {
    expect(buildCastingOptionLabel('pact_slot')).toBe('Pact Slot');
  });
});

describe('buildCastingOptions', () => {
  it('maps each option through the label builder', () => {
    expect(buildCastingOptions([higherSlot])).toEqual([
      {
        id: 'opt-1',
        label: '4th-level Slot',
        desc: null,
        damageRoll: '9d6',
        duration: null,
        range: null,
        targetCount: null,
        shapeSize: null,
        concentration: null,
      },
    ]);
  });

  it('is empty when the spell has no scaling options', () => {
    expect(buildCastingOptions([])).toEqual([]);
  });
});

describe('buildSpellDetail', () => {
  it('assembles the full detail from a spell and its casting options', () => {
    const detail = buildSpellDetail({
      spell: fireball,
      castingOptions: [higherSlot],
    });

    expect(detail.slug).toBe('srd-2024_fireball');
    expect(detail.subtitle).toBe('3rd-level Evocation');
    expect(detail.castingTime).toBe('1 Action');
    expect(detail.durationLabel).toBe('Instantaneous');
    expect(detail.componentsLabel).toContain('which the spell consumes');
    expect(detail.classes).toEqual(['Sorcerer', 'Wizard']);
    expect(detail.castingOptions).toHaveLength(1);
    expect(detail.higherLevel).toBe(fireball.higherLevel);
  });
});
