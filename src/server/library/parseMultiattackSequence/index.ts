export type MultiattackSequenceEntry = {
  actionName: string;
  count: number;
};

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const NUMBER_WORD_PATTERN = Object.keys(NUMBER_WORDS).join('|');

/**
 * A name/count clause never crosses a sentence boundary: the character class
 * excludes `.`, so a non-greedy name capture can only expand within the first
 * sentence, never past it into a trailing "It can replace..." clause. See the
 * parser's own doc comment for why this matters.
 */
const NAME = `[\\w'’ -]+?`;
const CLAUSE = `(${NUMBER_WORD_PATTERN}) (${NAME}) attacks?`;

const THREE_CLAUSE_PATTERN = new RegExp(
  `^The [\\w' -]+? makes ${CLAUSE}, ${CLAUSE}, and ${CLAUSE}\\.`,
  'i',
);
const TWO_CLAUSE_PATTERN = new RegExp(
  `^The [\\w' -]+? makes ${CLAUSE} and ${CLAUSE}\\.`,
  'i',
);
const SINGLE_CLAUSE_PATTERN = new RegExp(
  `^The [\\w' -]+? makes ${CLAUSE}\\.`,
  'i',
);

const toEntry = (numberWord: string, name: string): MultiattackSequenceEntry => ({
  actionName: name.trim(),
  count: NUMBER_WORDS[numberWord.toLowerCase()]!,
});

/**
 * Parses a "Multiattack" action's own `desc` prose into which other named
 * actions on the same creature it triggers and how many times each — Open5e
 * has no structured field for this, only prose (see `multiattackSequence` in
 * `schema.ts`).
 *
 * Handles the three clean, unambiguous shapes found in the real SRD-2024
 * data: "makes N Name attacks.", "makes N NameA attacks and M NameB
 * attacks.", and the three-clause comma-separated variant. A trailing clause
 * after the first sentence (an optional "It can replace one attack with
 * ...", an alternate "or it makes ... attacks" sequence) is ignored — the
 * base sequence is still extracted, the optional swap just isn't modeled.
 *
 * Deliberately returns null (rather than guessing) for shapes that can't be
 * reduced to a fixed sequence: a distributed choice ("using Scimitar or
 * Shortbow in any combination"), a count that depends on creature state
 * ("as many Bite attacks as it has heads"), or a clause that isn't itself an
 * attack ("makes one Bite attack and uses Constrict"). These are real,
 * intentional coverage gaps, not bugs — the engine falls back to a single
 * basic attack when this is null, same fallback `saveAreaColumns` already
 * uses for save/area data.
 */
export const parseMultiattackSequence = (
  desc: string,
): MultiattackSequenceEntry[] | null => {
  const three = desc.match(THREE_CLAUSE_PATTERN);
  if (three) {
    return [
      toEntry(three[1]!, three[2]!),
      toEntry(three[3]!, three[4]!),
      toEntry(three[5]!, three[6]!),
    ];
  }

  const two = desc.match(TWO_CLAUSE_PATTERN);
  if (two) {
    return [toEntry(two[1]!, two[2]!), toEntry(two[3]!, two[4]!)];
  }

  const single = desc.match(SINGLE_CLAUSE_PATTERN);
  if (single) {
    return [toEntry(single[1]!, single[2]!)];
  }

  return null;
};
