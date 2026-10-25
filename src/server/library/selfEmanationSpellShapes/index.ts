/**
 * Open5e's SRD-2024 `Spell.json` leaves `shape_type`/`shape_size` null for
 * every "Self"-range spell whose area is only ever described in prose — "a
 * 15-foot Emanation" appears in Spirit Guardians' `desc`, never in a
 * structured field, the same for the ten spells beside it below. The
 * measurement tool's spell picker (`useMeasurementControls`) filters out
 * anything missing either field, so without this override a DM reaching for
 * one of these spells simply wouldn't find it there at all.
 *
 * Hand-curated by grepping the SRD's own `desc` text for "N-foot Emanation"
 * on every spell upstream left shapeless — reviewable as code, the same
 * reasoning `EFFECT_CANDIDATES` documents for spell-effect matching
 * (DECISIONS #29). `mapSpellShapeType` already maps `'emanation'` onto the
 * tool's `circle`, so nothing downstream (the picker, placement, or
 * `importSpellEffects`' animation matching) needed to change.
 *
 * Every one of these is centered on the caster and has no automatic
 * "follow the caster" behavior of its own — there's no token/position
 * system on the map for a shape to follow yet, and building one is well
 * outside a measurement-tool change (DECISIONS #31). The DM re-centers it
 * by dragging, the same as any other already-placed shape.
 */
export const SELF_EMANATION_SPELL_SHAPES: Readonly<Record<string, number>> = {
  'srd-2024_antilife-shell': 10,
  'srd-2024_antimagic-field': 10,
  'srd-2024_aura-of-life': 30,
  'srd-2024_conjure-minor-elementals': 15,
  'srd-2024_conjure-woodland-beings': 10,
  'srd-2024_globe-of-invulnerability': 10,
  'srd-2024_holy-aura': 30,
  'srd-2024_pass-without-trace': 30,
  'srd-2024_speak-with-plants': 30,
  'srd-2024_spirit-guardians': 15,
  'srd-2024_tiny-hut': 10,
};

export interface SpellShape {
  shapeType: string | null;
  shapeSize: number | null;
  shapeSizeUnit: string | null;
}

/**
 * Fills in a known self-emanation spell's shape when upstream left it null.
 * Never overrides a shape upstream actually provided — this is a gap-filler,
 * not a correction of real data.
 */
export const applySelfEmanationShape = (
  slug: string,
  upstream: SpellShape,
): SpellShape => {
  if (upstream.shapeType !== null || upstream.shapeSize !== null) {
    return upstream;
  }

  const radiusFeet = SELF_EMANATION_SPELL_SHAPES[slug];
  if (radiusFeet === undefined) return upstream;

  return {
    shapeType: 'emanation',
    shapeSize: radiusFeet,
    shapeSizeUnit: 'feet',
  };
};
