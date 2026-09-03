import type { CreatureActionAttackFixture } from '~/server/library/fixtures';
import type { NewCreatureActionAttack } from '~/server/db/schema';

/** An attack's `parent` is an action slug, not a creature slug. */
export const toAttackRow = (
  fixture: CreatureActionAttackFixture,
): NewCreatureActionAttack => ({
  slug: fixture.pk,
  actionSlug: fixture.fields.parent,
  name: fixture.fields.name,
  attackType: fixture.fields.attack_type,
  toHitMod: fixture.fields.to_hit_mod,
  reach: fixture.fields.reach,
  range: fixture.fields.range,
  longRange: fixture.fields.long_range,
  targetCreatureOnly: fixture.fields.target_creature_only,
  damageDieCount: fixture.fields.damage_die_count,
  damageDieType: fixture.fields.damage_die_type,
  damageBonus: fixture.fields.damage_bonus,
  damageType: fixture.fields.damage_type,
  extraDamageDieCount: fixture.fields.extra_damage_die_count,
  extraDamageDieType: fixture.fields.extra_damage_die_type,
  extraDamageBonus: fixture.fields.extra_damage_bonus,
  extraDamageType: fixture.fields.extra_damage_type,
});
