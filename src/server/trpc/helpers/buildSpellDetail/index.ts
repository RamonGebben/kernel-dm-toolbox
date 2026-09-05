import type { Spell, SpellCastingOption } from '~/server/db/schema';
import { formatSpellLevel } from '~/utils/formatSpellLevel';
import { slugToTitle } from '~/utils/slugToTitle';

/**
 * Turns the raw library rows into everything the spell lookup pane needs to
 * render. Every derivation lives here rather than in the view, matching
 * `buildStatblock` — the view stays a dumb renderer and every branch here is
 * tested in the browser-free unit project.
 */

export type SpellCastingOptionDetail = {
  id: string;
  label: string;
  desc: string | null;
  damageRoll: string | null;
  duration: string | null;
  range: string | null;
  targetCount: number | null;
  shapeSize: number | null;
  concentration: boolean | null;
};

export type SpellDetail = {
  slug: string;
  name: string;
  /** "1st-level Evocation (ritual)", "Evocation Cantrip" */
  subtitle: string;
  levelLabel: string;
  school: string;
  castingTime: string;
  reactionCondition: string | null;
  rangeLabel: string;
  componentsLabel: string;
  durationLabel: string;
  ritual: boolean;
  concentration: boolean;
  targetLabel: string | null;
  shapeLabel: string | null;
  savingThrowLabel: string | null;
  attackRoll: boolean;
  damageRoll: string | null;
  damageTypes: string[];
  classes: string[];
  desc: string;
  higherLevel: string | null;
  castingOptions: SpellCastingOptionDetail[];
};

/** A spell's upstream slug is document-prefixed (`srd-2024_wizard`); a class one may be too. */
const stripDocumentPrefix = (slug: string): string =>
  slug.replace(/^[a-z0-9]+(?:-[a-z0-9]+)*_/, '');

export const buildSubtitle = (spell: Spell): string => {
  const school = slugToTitle(stripDocumentPrefix(spell.school));
  const ritualSuffix = spell.ritual ? ' (ritual)' : '';

  if (spell.level === 0) return `${school} Cantrip${ritualSuffix}`;

  return `${formatSpellLevel(spell.level)} ${school}${ritualSuffix}`;
};

const capitalizeFirst = (value: string): string =>
  value.length ? `${value.charAt(0).toUpperCase()}${value.slice(1)}` : value;

/** Upstream stores this compressed (`bonus-action`, `1minute`); this expands it to prose. */
export const buildCastingTimeLabel = (castingTime: string): string => {
  const match = /^(\d+)?([a-z][a-z-]*)$/.exec(castingTime);
  if (!match) return castingTime;

  const [, count = '1', unit] = match;
  return `${count} ${slugToTitle(unit)}`;
};

export const buildRangeLabel = (spell: Spell): string => {
  if (spell.rangeText) return spell.rangeText;
  if (spell.range > 0) return `${spell.range} ${spell.rangeUnit ?? 'feet'}`;
  return 'Self';
};

/** `V, S, M (a bit of fleece, which the spell consumes)` */
export const buildComponentsLabel = (spell: Spell): string => {
  const letters = [
    spell.verbal ? 'V' : null,
    spell.somatic ? 'S' : null,
    spell.material ? 'M' : null,
  ].filter((letter): letter is string => letter !== null);

  if (!spell.material || !spell.materialSpecified) return letters.join(', ');

  const consumedNote = spell.materialConsumed
    ? ', which the spell consumes'
    : '';
  return `${letters.join(', ')} (${spell.materialSpecified}${consumedNote})`;
};

/**
 * Upstream duration is lowercase prose (`instantaneous`, `until dispelled`)
 * and doesn't repeat "Concentration" itself, so both are handled here.
 */
export const buildDurationLabel = (spell: Spell): string => {
  if (!spell.concentration) return capitalizeFirst(spell.duration);
  if (spell.duration.toLowerCase().startsWith('concentration'))
    return capitalizeFirst(spell.duration);
  return `Concentration, ${spell.duration}`;
};

export const buildTargetLabel = (spell: Spell): string | null => {
  if (!spell.targetType) return null;

  const countPrefix = spell.targetCount > 1 ? `${spell.targetCount} ` : '';
  return `${countPrefix}${slugToTitle(spell.targetType)}`;
};

export const buildShapeLabel = (spell: Spell): string | null => {
  if (!spell.shapeType || spell.shapeSize == null) return null;

  const unit = spell.shapeSizeUnit ?? 'feet';
  return `${spell.shapeSize}-${unit} ${slugToTitle(spell.shapeType)}`;
};

export const buildSavingThrowLabel = (spell: Spell): string | null =>
  spell.savingThrowAbility
    ? `${slugToTitle(spell.savingThrowAbility)} save`
    : null;

export const buildClassLabels = (spell: Spell): string[] =>
  spell.classes.map(slug => slugToTitle(stripDocumentPrefix(slug))).sort();

/** `slot_level_3` → `3rd-level Slot`; anything unrecognised falls back to a title case. */
export const buildCastingOptionLabel = (type: string): string => {
  const match = /^slot_level_(\d+)$/.exec(type);
  if (match) return `${formatSpellLevel(Number(match[1]))} Slot`;

  return slugToTitle(type);
};

export const buildCastingOptions = (
  castingOptions: readonly SpellCastingOption[],
): SpellCastingOptionDetail[] =>
  castingOptions.map(option => ({
    id: option.id,
    label: buildCastingOptionLabel(option.type),
    desc: option.desc,
    damageRoll: option.damageRoll,
    duration: option.duration,
    range: option.range,
    targetCount: option.targetCount,
    shapeSize: option.shapeSize,
    concentration: option.concentration,
  }));

export const buildSpellDetail = ({
  spell,
  castingOptions,
}: {
  spell: Spell;
  castingOptions: readonly SpellCastingOption[];
}): SpellDetail => ({
  slug: spell.slug,
  name: spell.name,
  subtitle: buildSubtitle(spell),
  levelLabel: formatSpellLevel(spell.level),
  school: slugToTitle(stripDocumentPrefix(spell.school)),
  castingTime: buildCastingTimeLabel(spell.castingTime),
  reactionCondition: spell.reactionCondition,
  rangeLabel: buildRangeLabel(spell),
  componentsLabel: buildComponentsLabel(spell),
  durationLabel: buildDurationLabel(spell),
  ritual: spell.ritual,
  concentration: spell.concentration,
  targetLabel: buildTargetLabel(spell),
  shapeLabel: buildShapeLabel(spell),
  savingThrowLabel: buildSavingThrowLabel(spell),
  attackRoll: spell.attackRoll,
  damageRoll: spell.damageRoll,
  damageTypes: spell.damageTypes,
  classes: buildClassLabels(spell),
  desc: spell.desc,
  higherLevel: spell.higherLevel,
  castingOptions: buildCastingOptions(castingOptions),
});
