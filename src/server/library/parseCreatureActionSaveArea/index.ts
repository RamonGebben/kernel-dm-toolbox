const ABILITIES = [
  'Strength',
  'Dexterity',
  'Constitution',
  'Intelligence',
  'Wisdom',
  'Charisma',
] as const;

const SAVE_PATTERN = new RegExp(
  `(${ABILITIES.join('|')}) Saving Throw: DC (\\d+)`,
);

/** `90-foot-long, 5-foot-wide Line` — only the length is kept; there is no
 * width column, matching how a spell's own `shapeSize` has no width either. */
const LINE_PATTERN = /(\d+)-foot-long,\s*\d+-foot-wide Line/i;

/** `60-foot Cone` and friends. Sphere/Cube never actually appear on a
 * monster's own save actions in the SRD-2024 data (only on spells), but are
 * matched for completeness and forward compatibility with future imports. */
const RADIUS_SHAPE_PATTERN = /(\d+)-foot (Cone|Sphere|Cube)/i;

/**
 * `15-foot Emanation originating from the <creature>` — a 2024-rules area
 * centered on and moving with the creature itself. There is no `emanation`
 * member of `areaType` (the schema mirrors a spell's cone/line/sphere/cube
 * set), so this is mapped to `sphere` as the closest equivalent; the engine
 * still knows to re-center it on the creature each turn since that's true of
 * every action's origin, not something this column needs to carry.
 */
const EMANATION_PATTERN = /(\d+)-foot Emanation/i;

const DAMAGE_PATTERN =
  /Failure:\s*\d+\s*\((\d+d\d+(?:\s*\+\s*\d+)?)\)\s*([A-Za-z]+) damage/i;

const HALF_DAMAGE_PATTERN = /Success:\s*Half damage/i;

export type ParsedCreatureActionSaveArea = {
  saveAbility: string | null;
  saveDc: number | null;
  areaType: 'cone' | 'line' | 'sphere' | 'cube' | null;
  areaSize: number | null;
  areaSizeUnit: string | null;
  damageOnFailRoll: string | null;
  damageOnFailType: string | null;
  halfDamageOnSave: boolean;
};

const EMPTY_RESULT: ParsedCreatureActionSaveArea = {
  saveAbility: null,
  saveDc: null,
  areaType: null,
  areaSize: null,
  areaSizeUnit: null,
  damageOnFailRoll: null,
  damageOnFailType: null,
  halfDamageOnSave: true,
};

const parseArea = (
  desc: string,
): Pick<
  ParsedCreatureActionSaveArea,
  'areaType' | 'areaSize' | 'areaSizeUnit'
> => {
  const line = desc.match(LINE_PATTERN);
  if (line) {
    return {
      areaType: 'line',
      areaSize: Number(line[1]),
      areaSizeUnit: 'feet',
    };
  }

  const emanation = desc.match(EMANATION_PATTERN);
  if (emanation) {
    return {
      areaType: 'sphere',
      areaSize: Number(emanation[1]),
      areaSizeUnit: 'feet',
    };
  }

  const radiusShape = desc.match(RADIUS_SHAPE_PATTERN);
  if (radiusShape) {
    return {
      areaType: radiusShape[2].toLowerCase() as 'cone' | 'sphere' | 'cube',
      areaSize: Number(radiusShape[1]),
      areaSizeUnit: 'feet',
    };
  }

  return { areaType: null, areaSize: null, areaSizeUnit: null };
};

/**
 * Parses a `CreatureAction.desc` prose string for the save/area data Open5e
 * has no structured field for — see `saveAreaColumns` in `schema.ts`.
 *
 * The 2024 SRD's monster actions follow a fairly consistent template
 * ("X Saving Throw: DC N, each creature in a(n) ... Failure: N (NdN) type
 * damage. Success: Half damage."), but this is prose written for a human, not
 * a data format: anything that doesn't match returns null for that field
 * rather than throwing, so an unparseable description degrades to "no
 * structured save data" instead of blocking the whole import.
 */
export const parseCreatureActionSaveArea = (
  desc: string,
): ParsedCreatureActionSaveArea => {
  const save = desc.match(SAVE_PATTERN);
  if (!save) return EMPTY_RESULT;

  const damage = desc.match(DAMAGE_PATTERN);

  return {
    saveAbility: save[1].toLowerCase(),
    saveDc: Number(save[2]),
    ...parseArea(desc),
    damageOnFailRoll: damage ? damage[1].replace(/\s+/g, '') : null,
    damageOnFailType: damage ? damage[2].toLowerCase() : null,
    halfDamageOnSave: HALF_DAMAGE_PATTERN.test(desc),
  };
};
