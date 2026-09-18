import type { SpellFixture } from '~/server/library/fixtures';
import type { NewSpell } from '~/server/db/schema';
import { applySelfEmanationShape } from '~/server/library/selfEmanationSpellShapes';

/**
 * Upstream uses the empty string where a value is absent — no saving throw, no
 * material component, no "at higher levels" paragraph. Those become null so
 * the UI has one thing to check rather than two.
 */
const emptyToNull = (value: string): string | null => value.trim() || null;

export const toSpellRow = (fixture: SpellFixture): NewSpell => {
  const shape = applySelfEmanationShape(fixture.pk, {
    shapeType: fixture.fields.shape_type,
    shapeSize: fixture.fields.shape_size,
    shapeSizeUnit: fixture.fields.shape_size_unit,
  });

  return {
    slug: fixture.pk,
    document: fixture.fields.document,
    name: fixture.fields.name,
    desc: fixture.fields.desc,
    level: fixture.fields.level,
    school: fixture.fields.school,
    higherLevel: emptyToNull(fixture.fields.higher_level),

    targetType: emptyToNull(fixture.fields.target_type),
    rangeText: emptyToNull(fixture.fields.range_text),
    range: fixture.fields.range,
    rangeUnit: fixture.fields.range_unit,
    targetCount: fixture.fields.target_count,

    castingTime: fixture.fields.casting_time,
    reactionCondition: fixture.fields.reaction_condition,
    ritual: fixture.fields.ritual,
    concentration: fixture.fields.concentration,
    duration: fixture.fields.duration,

    verbal: fixture.fields.verbal,
    somatic: fixture.fields.somatic,
    material: fixture.fields.material,
    materialSpecified: emptyToNull(fixture.fields.material_specified),
    materialConsumed: fixture.fields.material_consumed,

    savingThrowAbility: emptyToNull(fixture.fields.saving_throw_ability),
    attackRoll: fixture.fields.attack_roll,
    damageRoll: emptyToNull(fixture.fields.damage_roll),
    damageTypes: fixture.fields.damage_types,

    shapeType: shape.shapeType,
    shapeSize: shape.shapeSize,
    shapeSizeUnit: shape.shapeSizeUnit,

    classes: fixture.fields.classes,
  };
};
