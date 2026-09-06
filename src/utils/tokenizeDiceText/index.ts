export type DiceTextSegment =
  | { type: 'text'; value: string }
  | {
      type: 'dice';
      /** The exact matched substring, e.g. "2d6 + 6" — preserves original spacing for display. */
      value: string;
      count: number;
      sides: number;
      modifier: number;
    };

/**
 * Matches dice notation ("3d6", "8d6 + 4", bare "d20") without snagging
 * unrelated text.
 *
 * The leading `(?<![a-zA-Z])` and trailing `(?![a-rt-z])` (case-insensitive,
 * so both cases) keep it from matching inside a word like "3rd" or "damage",
 * while still letting a trailing plural "s" pass through as plain text
 * ("d6s" -> dice segment "d6" + text segment "s"). Everything outside the
 * match — including a leading precomputed average like the "13" in
 * "13 (2d6 + 6)" — is untouched, which is what keeps only the parenthetical
 * dice clickable with no special-case parens handling.
 */
const DICE_PATTERN =
  /(?<![a-zA-Z])(\d+)?d(\d+)(?:\s*([+-])\s*(\d+))?(?![a-rt-z])/gi;

/** Splits free-form text into plain-text and dice-expression segments. */
export const tokenizeDiceText = (text: string): DiceTextSegment[] => {
  const segments: DiceTextSegment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(DICE_PATTERN)) {
    const [value, count, sides, sign, modifier] = match;
    const index = match.index;

    if (index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, index) });
    }

    segments.push({
      type: 'dice',
      value,
      count: count ? Number.parseInt(count, 10) : 1,
      sides: Number.parseInt(sides, 10),
      modifier: modifier
        ? Number.parseInt(modifier, 10) * (sign === '-' ? -1 : 1)
        : 0,
    });

    lastIndex = index + value.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
};
