export type ParsedConditionApplication = {
  /** The 2024 SRD's lowercase condition key (`conditions.key`), e.g.
   * `paralyzed` — resolved to `conditions.slug` by the caller, which has the
   * full imported condition list available and this parser (a pure
   * function) does not. */
  appliesConditionKey: string | null;
  conditionDurationRounds: number | null;
  conditionSaveEndsEachTurn: boolean;
};

const EMPTY_RESULT: ParsedConditionApplication = {
  appliesConditionKey: null,
  conditionDurationRounds: null,
  conditionSaveEndsEachTurn: false,
};

/** The fifteen 2024 SRD condition names, Title Case exactly as Open5e's
 * prose renders them (`conditions.name`). */
const CONDITION_NAMES = [
  'Blinded',
  'Charmed',
  'Deafened',
  'Exhaustion',
  'Frightened',
  'Grappled',
  'Incapacitated',
  'Invisible',
  'Paralyzed',
  'Petrified',
  'Poisoned',
  'Prone',
  'Restrained',
  'Stunned',
  'Unconscious',
] as const;

const CONDITION_APPLICATION_PATTERN = new RegExp(
  `(?:has|have|gains?|gives? it) the (${CONDITION_NAMES.join('|')}) condition`,
  'g',
);

/**
 * A two-stage escalating effect ("First Failure ... Second Failure ...", or
 * a second save called out explicitly) applies more than one condition in
 * sequence — not representable by this schema's single
 * `appliesConditionSlug`. Caught more directly by the "more than one
 * distinct condition mentioned" check below in most real cases, this is a
 * backstop for prose that mentions the same condition twice while still
 * being a staged effect.
 */
const MULTI_STAGE_PATTERN = /First Failure|Second Failure|second save/i;

const UNTIL_NEXT_TURN_PATTERN =
  /until the (?:start|end) of [a-z'’ ]*?next turn/i;

/**
 * The "repeats the save" and "at the end of each of its turns" clauses
 * appear in either order depending on the source — a dragon breath puts the
 * timing clause after ("repeats the save at the end of each of its turns,
 * ending the effect..."), a spell puts it before ("At the end of each of
 * its turns, the target repeats the save, ending the spell..."). Checked as
 * two independent markers rather than one fixed sequence so both read
 * correctly.
 */
const REPEATS_SAVE_PATTERN = /repeats? the save/i;
const SAVE_ENDS_ON_SUCCESS_PATTERN =
  /ending the (?:effect|spell) on itself on a success/i;

const MINUTE_CAP_PATTERN = /After (?:(\d+)|an?) minutes?, it succeeds automatically/i;

const ROUNDS_PER_MINUTE = 10;

/**
 * Parses a creature action's or spell's `desc` prose for "this applies a
 * condition on a failed save" data — Open5e has no structured field for
 * this on either source (see `conditionApplicationColumns` in `schema.ts`).
 *
 * The 2024 SRD consistently phrases condition application as "the target
 * has/have the <Name> condition" (occasionally "gives it the <Name>
 * condition"). This is prose written for a human, not a data format:
 * anything that doesn't match, or that mentions more than one distinct
 * condition (a multi-stage escalating effect this schema can't represent,
 * e.g. a dragon's paralyzing breath going Incapacitated → Paralyzed, or
 * Sleep going Incapacitated → Unconscious), returns the empty result rather
 * than guessing.
 *
 * Duration is best-effort: a fixed "until the start/end of its next turn"
 * becomes one round; "repeats the save ... ending on a success" becomes a
 * repeat-save flag, optionally capped by an explicit "after N minutes, it
 * succeeds automatically". Anything else (a duration tied to an external
 * event like "until the grapple ends", or an out-of-combat-scale duration
 * like "for 24 hours") is left with no fixed round count — the condition is
 * treated as persisting for the rest of the simulated fight, the same
 * indefinite treatment the live tracker's own `combatant_conditions.
 * roundsRemaining` already gives Prone.
 */
export const parseConditionApplication = (
  desc: string,
): ParsedConditionApplication => {
  const matches = [...desc.matchAll(CONDITION_APPLICATION_PATTERN)];
  const uniqueConditionNames = new Set(matches.map(match => match[1]));

  if (uniqueConditionNames.size !== 1 || MULTI_STAGE_PATTERN.test(desc)) {
    return EMPTY_RESULT;
  }

  const [conditionName] = uniqueConditionNames;
  const appliesConditionKey = conditionName!.toLowerCase();
  const conditionSaveEndsEachTurn =
    REPEATS_SAVE_PATTERN.test(desc) && SAVE_ENDS_ON_SUCCESS_PATTERN.test(desc);

  const minuteCap = desc.match(MINUTE_CAP_PATTERN);
  if (minuteCap) {
    const minutes = minuteCap[1] ? Number(minuteCap[1]) : 1;
    return {
      appliesConditionKey,
      conditionDurationRounds: minutes * ROUNDS_PER_MINUTE,
      conditionSaveEndsEachTurn,
    };
  }

  if (!conditionSaveEndsEachTurn && UNTIL_NEXT_TURN_PATTERN.test(desc)) {
    return {
      appliesConditionKey,
      conditionDurationRounds: 1,
      conditionSaveEndsEachTurn: false,
    };
  }

  return {
    appliesConditionKey,
    conditionDurationRounds: null,
    conditionSaveEndsEachTurn,
  };
};
