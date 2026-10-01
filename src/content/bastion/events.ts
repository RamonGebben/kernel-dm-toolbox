/**
 * Bastion Events (2024 DMG chapter 8): what a Maintain order can turn up.
 * One d100 roll per character who maintains. Numbers kept, summaries in our
 * own words (DECISIONS #33).
 */

export type BastionEventKey =
  | 'all-is-well'
  | 'attack'
  | 'criminal-hireling'
  | 'extraordinary-opportunity'
  | 'friendly-visitors'
  | 'guest'
  | 'lost-hirelings'
  | 'magical-discovery'
  | 'refugees'
  | 'request-for-aid'
  | 'treasure';

export type BastionEventDefinition = {
  key: BastionEventKey;
  name: string;
  /** Inclusive d100 range; 100 is rolled as 00. */
  from: number;
  to: number;
  summary: string;
};

export const bastionEvents: readonly BastionEventDefinition[] = [
  {
    key: 'all-is-well',
    name: 'All Is Well',
    from: 1,
    to: 50,
    summary: 'Nothing of note. A quiet week — add some colour if you like.',
  },
  {
    key: 'attack',
    name: 'Attack',
    from: 51,
    to: 55,
    summary:
      'Raiders strike. Roll 6d6 (fewer with full walls or War Room lieutenants, d8s with a stocked Armory); each 1 kills a defender. With no defenders, a special facility is out of action next turn.',
  },
  {
    key: 'criminal-hireling',
    name: 'Criminal Hireling',
    from: 56,
    to: 58,
    summary:
      'A hireling is caught breaking the law. Pay a 1d6 × 100 GP bribe, or they are arrested and their facility is out of action next turn.',
  },
  {
    key: 'extraordinary-opportunity',
    name: 'Extraordinary Opportunity',
    from: 59,
    to: 63,
    summary:
      'A chance to invest 500 GP. Pay it and roll again on this table (rerolling this result); decline and nothing happens.',
  },
  {
    key: 'friendly-visitors',
    name: 'Friendly Visitors',
    from: 64,
    to: 72,
    summary:
      'Visitors pay 1d6 × 100 GP to use one facility. Its work carries on undisturbed.',
  },
  {
    key: 'guest',
    name: 'Guest',
    from: 73,
    to: 76,
    summary:
      'Someone comes to stay — roll 1d4: a renowned guest, a guest seeking sanctuary (1d6 × 100 GP gift), a mercenary (+1 defender), or a friendly monster (no defender losses in the next attack).',
  },
  {
    key: 'lost-hirelings',
    name: 'Lost Hirelings',
    from: 77,
    to: 79,
    summary:
      "A facility's hirelings go missing. It is out of action next turn, then they are replaced.",
  },
  {
    key: 'magical-discovery',
    name: 'Magical Discovery',
    from: 80,
    to: 83,
    summary:
      "The hirelings find an Uncommon potion or scroll of the owner's choice.",
  },
  {
    key: 'refugees',
    name: 'Refugees',
    from: 84,
    to: 91,
    summary:
      '2d4 refugees ask for shelter and pay 1d6 × 100 GP. They stay until rehomed or the bastion is attacked.',
  },
  {
    key: 'request-for-aid',
    name: 'Request for Aid',
    from: 92,
    to: 98,
    summary:
      'Locals ask for help. Send any number of defenders and roll a d6 each: 10 or more earns 1d6 × 100 GP; less earns half that and one defender dies.',
  },
  {
    key: 'treasure',
    name: 'Treasure',
    from: 99,
    to: 100,
    summary:
      'The hirelings turn up treasure — roll d100 on the treasure table. It goes to storage.',
  },
];

/** Guest sub-table (1d4). */
export const guestKinds = [
  {
    roll: 1,
    key: 'renowned',
    label: 'A renowned guest — stays 7 days, leaves a letter of recommendation',
  },
  {
    roll: 2,
    key: 'sanctuary',
    label:
      'A guest seeking sanctuary — stays 7 days, gives a 1d6 × 100 GP gift',
  },
  {
    roll: 3,
    key: 'mercenary',
    label: 'A mercenary — joins as one more defender',
  },
  {
    roll: 4,
    key: 'monster',
    label: 'A friendly monster — no defender losses in the next attack',
  },
] as const;

export type GuestKind = (typeof guestKinds)[number]['key'];

/** Treasure sub-table (d100). Item rows let the owner pick the table. */
export const treasureRows: readonly {
  from: number;
  to: number;
  label: string;
}[] = [
  { from: 1, to: 40, label: 'An art object worth 25 GP' },
  { from: 41, to: 63, label: 'An art object worth 250 GP' },
  { from: 64, to: 73, label: 'An art object worth 750 GP' },
  { from: 74, to: 75, label: 'An art object worth 2,500 GP' },
  {
    from: 76,
    to: 90,
    label: 'A Common magic item (Arcana, Armaments, Implements or Relics)',
  },
  {
    from: 91,
    to: 98,
    label: 'An Uncommon magic item (Arcana, Armaments, Implements or Relics)',
  },
  {
    from: 99,
    to: 100,
    label: 'A Rare magic item (Arcana, Armaments, Implements or Relics)',
  },
];
