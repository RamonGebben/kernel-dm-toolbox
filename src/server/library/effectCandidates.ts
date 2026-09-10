import type { MeasurementShapeType } from '~/utils/mapMeasurement';

/**
 * A hand-curated match from (damage type, area shape) to one specific clip
 * in `jackkerouac/animated-spell-effects`.
 *
 * The upstream repo has no per-spell mapping of its own — it's a general
 * library of ~400 elemental VFX clips grouped by theme (fire/ice/lightning/…)
 * and tagged only with a shape suffix (`_CIRCLE_`/`_CONE_`/`_RAY_`/`_SQUARE_`/
 * `_RECTANGLE_`), not by spell name (see issue #1's follow-up and the repo's
 * own `scripts/effects.js` Foundry manifest, which only carries generic
 * labels like "FIRE - Explosion 01"). This table is that missing mapping,
 * picked by hand from the repo's actual file listing — data, not logic, so
 * it's reviewable and stays small rather than a runtime folder/keyword
 * matcher that would silently pick a different file if the upstream repo's
 * listing ever reordered.
 *
 * Bludgeoning/piercing/slashing (and anything with no damage type at all)
 * are deliberately absent: there is no elemental theme to match a physical
 * hit to, so those spells get no effect — the same "no good match, so no
 * guess" rule `mapDamageTypesToColor` already follows for colour.
 *
 * Paths are relative to the repo root, e.g. `spell-effects/fire/…webm`.
 */
export const EFFECT_CANDIDATES: Partial<
  Record<string, Partial<Record<MeasurementShapeType, string>>>
> = {
  acid: {
    circle: 'spell-effects/misc/pentagram_green_CIRCLE_01.webm',
    cube: 'spell-effects/misc/hand_green_SQUARE_02.webm',
  },
  cold: {
    // `ice/` has no CIRCLE clip of its own; the blue pentagram is the
    // closest available stand-in.
    circle: 'spell-effects/misc/pentagram_blue_CIRCLE_01.webm',
    cone: 'spell-effects/ice/frost_CONE_01.webm',
    line: 'spell-effects/ice/frost_beam_RAY_01.webm',
    cube: 'spell-effects/ice/frost-SQUARE_01.webm',
  },
  fire: {
    circle: 'spell-effects/fire/fire_ball_CIRCLE_02.webm',
    cone: 'spell-effects/fire/fire_cone_CONE_01.webm',
    line: 'spell-effects/fire/fire_bolt_RAY_01.webm',
    cube: 'spell-effects/fire/fire_square_SQUARE_01.webm',
  },
  force: {
    circle: 'spell-effects/energy/energy_circle_CIRCLE_01.webm',
    line: 'spell-effects/energy/energy_beam_RAY_01.webm',
    cube: 'spell-effects/magic/magic_forcefield_SQUARE_01.webm',
  },
  lightning: {
    circle: 'spell-effects/lightning/electricity_portal_CIRCLE_01.webm',
    line: 'spell-effects/lightning/lightning_blast_RAY_01.webm',
    cube: 'spell-effects/lightning/lightning_blue_RECTANGLE_01.webm',
  },
  necrotic: {
    circle: 'spell-effects/misc/skull_blast_CIRCLE_01.webm',
  },
  poison: {
    circle: 'spell-effects/misc/trident_green_CIRCLE_02.webm',
  },
  psychic: {
    circle: 'spell-effects/magic/magic_wild_CIRCLE_01.webm',
    line: 'spell-effects/magic/magic_wild_RAY_02.webm',
  },
  radiant: {
    circle: 'spell-effects/misc/lathander_symbol_CIRCLE_01.webm',
    line: 'spell-effects/magic/magic_beam_RAY_01.webm',
    cube: 'spell-effects/misc/hand_yellow_SQUARE_05.webm',
  },
  thunder: {
    circle: 'spell-effects/air/shockwave_CIRCLE_01.webm',
    cone: 'spell-effects/air/dust_blast_CONE_01.webm',
    line: 'spell-effects/air/wind_blast_RAY_01.webm',
    cube: 'spell-effects/air/clouds_lightning_SQUARE_02.webm',
  },
};

/**
 * The effect clip for a spell, or `null` when nothing matches — either an
 * unrecognised/absent damage type, or a shape this feature doesn't have a
 * clip for. The first listed damage type wins for a spell with more than
 * one, matching `mapDamageTypesToColor`'s own tie-break.
 */
export const pickEffectSourcePath = (
  damageTypes: readonly string[],
  shapeType: MeasurementShapeType,
): string | null => {
  for (const damageType of damageTypes) {
    const path = EFFECT_CANDIDATES[damageType.toLowerCase()]?.[shapeType];
    if (path) return path;
  }
  return null;
};
