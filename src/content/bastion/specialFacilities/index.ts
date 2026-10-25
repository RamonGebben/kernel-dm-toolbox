import { cite } from '~/content/bastion/sources';
import type { SpecialFacilityDefinition } from '~/content/bastion/types';

/**
 * The 29 core special facilities, level then alphabetical.
 *
 * A cheat sheet in our own words: the numbers the rules run on, with terse
 * summaries — never the book's text (DECISIONS #33).
 */
export const specialFacilities: ReadonlyArray<SpecialFacilityDefinition> = [
  // Level 5 ------------------------------------------------------------------
  {
    key: 'arcane-study',
    name: 'Arcane Study',
    level: 5,
    prerequisite: 'arcane-focus',
    space: 'roomy',
    hirelings: 1,
    order: 'craft',
    orderOptions: [
      {
        key: 'arcane-focus',
        label: 'Arcane Focus',
        summary: 'Makes one Arcane Focus. Free.',
        durationDays: 7,
        costGp: null,
        yields: { name: 'Arcane Focus', quantity: 1 },
      },
      {
        key: 'book',
        label: 'Blank book',
        summary: 'Makes one blank book.',
        durationDays: 7,
        costGp: 10,
        yields: { name: 'Blank book', quantity: 1 },
      },
      {
        key: 'magic-item',
        label: 'Magic item (Arcana)',
        summary: `A Common or Uncommon item from the Arcana tables (${cite('random-magic-items')}). Time and cost per the magic item crafting rules (${cite('crafting-magic-items')}).`,
        durationDays: null,
        costGp: null,
        minimumLevel: 9,
      },
    ],
    benefits: [
      'Long Rest here: gain a charm of Identify, usable once, lasting 7 days.',
    ],
  },
  {
    key: 'armory',
    name: 'Armory',
    level: 5,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'trade',
    orderOptions: [
      {
        key: 'stock',
        label: 'Stock the armory',
        summary:
          '100 GP + 100 GP per defender, halved with a Smithy. While stocked, defender loss dice are d8 instead of d6.',
        durationDays: 7,
        costGp: null,
        effect: 'stock-armory',
      },
    ],
    benefits: ['Stock is used up by any event that rolls for defender losses.'],
  },
  {
    key: 'barrack',
    name: 'Barrack',
    level: 5,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'recruit',
    orderOptions: [
      {
        key: 'defenders',
        label: 'Recruit defenders',
        summary: 'Up to 4 Bastion Defenders join, free. Not while full.',
        durationDays: 7,
        costGp: null,
        effect: 'recruit-defenders',
      },
    ],
    benefits: ['Houses up to 12 Bastion Defenders.'],
    allowMultiple: true,
    enlarge: {
      costGp: 2000,
      summary: 'Houses up to 25 Bastion Defenders.',
      extraHirelings: 0,
    },
  },
  {
    key: 'garden',
    name: 'Garden',
    level: 5,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'harvest',
    orderOptions: [
      {
        key: 'decorative',
        label: 'Decorative harvest',
        summary: '10 bouquets (5 GP each), 10 vials of perfume, or 10 candles.',
        durationDays: 7,
        costGp: null,
      },
      {
        key: 'food',
        label: 'Food harvest',
        summary: '100 days of Rations.',
        durationDays: 7,
        costGp: null,
        yields: { name: 'Rations (days)', quantity: 100 },
      },
      {
        key: 'herb',
        label: 'Herb harvest',
        summary: "10 Healer's Kits, or 1 Potion of Healing.",
        durationDays: 7,
        costGp: null,
      },
      {
        key: 'poison',
        label: 'Poison harvest',
        summary: '2 vials of Antitoxin, or 1 vial of Basic Poison.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'Harvest matches the garden type. Changing type takes 21 days, idle meanwhile.',
    ],
    variant: {
      label: 'Garden type',
      options: ['Decorative', 'Food', 'Herb', 'Poison'],
    },
    allowMultiple: true,
    enlarge: {
      costGp: 2000,
      summary: 'Counts as two Roomy gardens, each typed and harvested apart.',
      extraHirelings: 1,
    },
  },
  {
    key: 'library',
    name: 'Library',
    level: 5,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'research',
    orderOptions: [
      {
        key: 'topical-lore',
        label: 'Topical lore',
        summary: 'Up to 3 accurate facts on a chosen topic, picked by the DM.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [],
  },
  {
    key: 'sanctuary',
    name: 'Sanctuary',
    level: 5,
    prerequisite: 'holy-or-druidic-focus',
    space: 'roomy',
    hirelings: 1,
    order: 'craft',
    orderOptions: [
      {
        key: 'sacred-focus',
        label: 'Sacred focus',
        summary: 'Makes one Holy Symbol or Druidic Focus. Free.',
        durationDays: 7,
        costGp: null,
        yields: { name: 'Holy Symbol or Druidic Focus', quantity: 1 },
      },
    ],
    benefits: [
      'Long Rest here: gain a charm of Healing Word, usable once, lasting 7 days.',
    ],
  },
  {
    key: 'smithy',
    name: 'Smithy',
    level: 5,
    prerequisite: null,
    space: 'roomy',
    hirelings: 2,
    order: 'craft',
    orderOptions: [
      {
        key: 'smith-tools',
        label: "Smith's Tools work",
        summary: `Anything Smith's Tools can make (${cite('tools')}), per the crafting rules (${cite('crafting-equipment')}).`,
        durationDays: null,
        costGp: null,
      },
      {
        key: 'magic-item',
        label: 'Magic item (Armaments)',
        summary: `An item from the Armaments tables (${cite('random-magic-items')}). Time and cost per the magic item crafting rules (${cite('crafting-magic-items')}).`,
        durationDays: null,
        costGp: null,
        minimumLevel: 9,
      },
    ],
    benefits: ['Halves the cost of stocking an Armory.'],
  },
  {
    key: 'storehouse',
    name: 'Storehouse',
    level: 5,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'trade',
    orderOptions: [
      {
        key: 'buy',
        label: 'Buy goods',
        summary:
          'Stock up to 500 GP of nonmagical goods (2,000 at level 9, 5,000 at level 13).',
        durationDays: 7,
        costGp: null,
        effect: 'buy-goods',
      },
      {
        key: 'sell',
        label: 'Sell goods',
        summary:
          'Sell stored goods at +10% (+20% at level 9, +50% at 13, +100% at 17).',
        durationDays: 7,
        costGp: null,
        effect: 'sell-goods',
      },
    ],
    benefits: [],
  },
  {
    key: 'workshop',
    name: 'Workshop',
    level: 5,
    prerequisite: null,
    space: 'roomy',
    hirelings: 3,
    order: 'craft',
    orderOptions: [
      {
        key: 'adventuring-gear',
        label: 'Adventuring gear',
        summary: `Anything the workshop's tools can make (${cite('tools')}), per the crafting rules (${cite('crafting-equipment')}).`,
        durationDays: null,
        costGp: null,
      },
      {
        key: 'magic-item',
        label: 'Magic item (Implements)',
        summary: `An item from the Implements tables (${cite('random-magic-items')}). Time and cost per the magic item crafting rules (${cite('crafting-magic-items')}).`,
        durationDays: null,
        costGp: null,
        minimumLevel: 9,
      },
    ],
    benefits: [
      "Equipped with 6 kinds of Artisan's Tools, chosen from 11.",
      'Short Rest here: gain Heroic Inspiration, once per Long Rest.',
    ],
    enlarge: {
      costGp: 2000,
      summary: "Adds 3 more kinds of Artisan's Tools.",
      extraHirelings: 2,
    },
  },

  // Level 9 ------------------------------------------------------------------
  {
    key: 'gaming-hall',
    name: 'Gaming Hall',
    level: 9,
    prerequisite: null,
    space: 'vast',
    hirelings: 4,
    order: 'trade',
    orderOptions: [
      {
        key: 'gambling-den',
        label: 'Run a gambling den',
        summary:
          'Roll d100 for winnings: 01–50 1d6×10 GP; 51–85 2d6×10; 86–95 4d6×10; 96–00 10d6×10.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [],
  },
  {
    key: 'greenhouse',
    name: 'Greenhouse',
    level: 9,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'harvest',
    orderOptions: [
      {
        key: 'greater-healing',
        label: 'Potion of Healing (greater)',
        summary: 'One Potion of Healing (greater). Free.',
        durationDays: 7,
        costGp: null,
        yields: { name: 'Potion of Healing (greater)', quantity: 1 },
      },
      {
        key: 'poison',
        label: 'Poison',
        summary: `One dose of Assassin's Blood, Malice, Pale Tincture or Truth Serum (${cite('poisons')}). Free.`,
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'Grows 3 magic fruits a day; eating one works like Lesser Restoration.',
    ],
  },
  {
    key: 'laboratory',
    name: 'Laboratory',
    level: 9,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'craft',
    orderOptions: [
      {
        key: 'alchemist-supplies',
        label: "Alchemist's Supplies work",
        summary: `Anything Alchemist's Supplies can make (${cite('tools')}), per the crafting rules (${cite('crafting-equipment')}).`,
        durationDays: null,
        costGp: null,
      },
      {
        key: 'poison',
        label: 'Poison',
        summary: `One dose of Burnt Othur Fumes, Essence of Ether or Torpor, at half its price (${cite('poisons')}).`,
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [],
  },
  {
    key: 'sacristy',
    name: 'Sacristy',
    level: 9,
    prerequisite: 'holy-or-druidic-focus',
    space: 'roomy',
    hirelings: 1,
    order: 'craft',
    orderOptions: [
      {
        key: 'holy-water',
        label: 'Holy Water',
        summary:
          'One flask, free. Each 100 GP spent (max 500) adds +1d8 to its damage.',
        durationDays: 7,
        costGp: null,
        yields: { name: 'Holy Water', quantity: 1 },
      },
      {
        key: 'magic-item',
        label: 'Magic item (Relics)',
        summary: `An item from the Relics tables (${cite('random-magic-items')}). Time and cost per the magic item crafting rules (${cite('crafting-magic-items')}).`,
        durationDays: null,
        costGp: null,
      },
    ],
    benefits: [
      'Short Rest here: regain one spell slot of level 5 or lower, once per Long Rest.',
    ],
  },
  {
    key: 'scriptorium',
    name: 'Scriptorium',
    level: 9,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'craft',
    orderOptions: [
      {
        key: 'book-replica',
        label: 'Book replica',
        summary: 'Copies a nonmagical book onto a blank book you supply.',
        durationDays: 7,
        costGp: null,
      },
      {
        key: 'spell-scroll',
        label: 'Spell Scroll',
        summary: `A Cleric or Wizard spell of level 3 or lower. Time and cost per the scroll scribing rules (${cite('scribing-spell-scrolls')}).`,
        durationDays: null,
        costGp: null,
      },
      {
        key: 'paperwork',
        label: 'Paperwork',
        summary:
          'Up to 50 copies of a notice or pamphlet at 1 GP each; can be spread within 50 miles.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [],
  },
  {
    key: 'stable',
    name: 'Stable',
    level: 9,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'trade',
    orderOptions: [
      {
        key: 'mounts',
        label: 'Buy or sell mounts',
        summary:
          'Trade animals at normal price; sell at +20% (+50% at level 13, +100% at 17).',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'Comes with a Riding Horse or Camel and two Ponies or Mules.',
      'Holds 3 Large animals (2 Medium count as 1 Large).',
      'A mount kept here 14+ days gives Advantage on Animal Handling with it.',
    ],
    allowMultiple: true,
    enlarge: {
      costGp: 2000,
      summary: 'Holds 6 Large animals.',
      extraHirelings: 0,
    },
  },
  {
    key: 'teleportation-circle',
    name: 'Teleportation Circle',
    level: 9,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'recruit',
    orderOptions: [
      {
        key: 'spellcaster',
        label: 'Invite a spellcaster',
        summary:
          'Roll any die: even, they come. They cast one Wizard spell of level 4 or lower (8 or lower at level 17); you pay costly components.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'A guest spellcaster stays 14 days or until they cast; leaves if the bastion is attacked.',
    ],
  },
  {
    key: 'theater',
    name: 'Theater',
    level: 9,
    prerequisite: null,
    space: 'vast',
    hirelings: 4,
    order: 'empower',
    orderOptions: [
      {
        key: 'production',
        label: 'Stage a production',
        summary:
          '14 days of rehearsal, then 7+ days of shows. Contributors roll DC 15 Charisma (Performance); more successes than failures earns each a Theater die.',
        durationDays: 14,
        costGp: null,
      },
    ],
    benefits: [
      'Theater die: d6 (d8 at level 13, d10 at 17), added to one D20 Test; a new die replaces an unused one.',
      'A character can contribute as composer (14 days), director or performer.',
    ],
  },
  {
    key: 'training-area',
    name: 'Training Area',
    level: 9,
    prerequisite: null,
    space: 'vast',
    hirelings: 4,
    order: 'empower',
    orderOptions: [
      {
        key: 'training',
        label: 'Train',
        summary:
          '8 hours a day for 7 days; the benefit lasts 7 days and depends on the trainer.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'Battle: Reaction to cut weapon or unarmed damage by 1d4.',
      'Skills: proficiency in Acrobatics, Athletics, Performance, Sleight of Hand or Stealth.',
      'Tools: proficiency with one tool.',
      'Unarmed Combat: +1d4 Bludgeoning on unarmed hits.',
      'Weapon: proficiency with one weapon, or its mastery if already proficient.',
      'The trainer can be swapped each bastion turn.',
    ],
    variant: {
      label: 'Trainer',
      options: ['Battle', 'Skills', 'Tools', 'Unarmed Combat', 'Weapon'],
    },
    allowMultiple: true,
  },
  {
    key: 'trophy-room',
    name: 'Trophy Room',
    level: 9,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'research',
    orderOptions: [
      {
        key: 'lore',
        label: 'Lore',
        summary: 'Up to 3 facts on a chosen topic.',
        durationDays: 7,
        costGp: null,
      },
      {
        key: 'trinket-trophy',
        label: 'Trinket trophy',
        summary: `Roll any die: even, one Common item from the Implements tables (${cite('random-magic-items')}).`,
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [],
  },

  // Level 13 -----------------------------------------------------------------
  {
    key: 'archive',
    name: 'Archive',
    level: 13,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'research',
    orderOptions: [
      {
        key: 'helpful-lore',
        label: 'Helpful lore',
        summary: 'Works like the Legend Lore spell.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'One reference book: Advantage on the Study action for Arcana, History, Investigation, Nature or Religion.',
    ],
    enlarge: {
      costGp: 2000,
      summary: 'Two more reference books.',
      extraHirelings: 0,
    },
  },
  {
    key: 'meditation-chamber',
    name: 'Meditation Chamber',
    level: 13,
    prerequisite: null,
    space: 'cramped',
    hirelings: 1,
    order: 'empower',
    orderOptions: [
      {
        key: 'inner-peace',
        label: 'Inner peace',
        summary: 'The next bastion event is rolled twice; pick either result.',
        durationDays: 7,
        costGp: null,
      },
      {
        key: 'fortify-self',
        label: 'Fortify self',
        summary:
          'Meditate 7 days without leaving; then Advantage on 2 random saving throws (d6, reroll duplicates) for 7 days.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [],
  },
  {
    key: 'menagerie',
    name: 'Menagerie',
    level: 13,
    prerequisite: null,
    space: 'vast',
    hirelings: 2,
    order: 'recruit',
    orderOptions: [
      {
        key: 'creature',
        label: 'Add a creature',
        summary:
          'By CR: 0 or 1/8 50 GP; 1/4 250; 1/2 500; 1 1,000; 2 2,000; 3 3,500 (e.g. Owlbear 3,500, Lion 1,000).',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'Holds 4 Large creatures (4 Small or Medium count as 1 Large).',
      'Its creatures count as Bastion Defenders unless opted out.',
    ],
  },
  {
    key: 'observatory',
    name: 'Observatory',
    level: 13,
    prerequisite: 'any-spellcasting-focus',
    space: 'roomy',
    hirelings: 1,
    order: 'empower',
    orderOptions: [
      {
        key: 'eldritch-discovery',
        label: 'Eldritch discovery',
        summary:
          '7 nights of study, then roll any die: odd, gain a charm of Darkvision, Heroism or Vitality.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'Long Rest here: gain a charm of Contact Other Plane, lasting 7 days.',
    ],
  },
  {
    key: 'pub',
    name: 'Pub',
    level: 13,
    prerequisite: null,
    space: 'roomy',
    hirelings: 1,
    order: 'research',
    orderOptions: [
      {
        key: 'information-gathering',
        label: 'Information gathering',
        summary:
          'Spies report events within 10 miles, and can find a known creature within 50 miles plus where it was over the last 7 days.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'One magic beverage on tap (of 5), switchable at the start of a bastion turn.',
    ],
    enlarge: {
      costGp: 2000,
      summary: 'Two magic beverages on tap.',
      extraHirelings: 3,
    },
  },
  {
    key: 'reliquary',
    name: 'Reliquary',
    level: 13,
    prerequisite: 'holy-or-druidic-focus',
    space: 'cramped',
    hirelings: 1,
    order: 'harvest',
    orderOptions: [
      {
        key: 'talisman',
        label: 'Talisman',
        summary:
          'Free. Stands in for one spell material component worth up to 1,000 GP; harvest again after use.',
        durationDays: 7,
        costGp: null,
        yields: { name: 'Talisman', quantity: 1 },
      },
    ],
    benefits: [
      'Long Rest here: gain a charm of Greater Restoration, lasting 7 days.',
    ],
  },

  // Level 17 -----------------------------------------------------------------
  {
    key: 'demiplane',
    name: 'Demiplane',
    level: 17,
    prerequisite: 'arcane-focus',
    space: 'vast',
    hirelings: 1,
    order: 'empower',
    orderOptions: [
      {
        key: 'arcane-resilience',
        label: 'Arcane resilience',
        summary:
          'Runes last 7 days; a Long Rest inside grants Temporary Hit Points equal to 5 × your level.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'Once per Long Rest, create a nonmagical object worth up to 5 GP.',
      'Its door can be moved during a bastion turn.',
    ],
  },
  {
    key: 'guildhall',
    name: 'Guildhall',
    level: 17,
    prerequisite: 'skill-expertise',
    space: 'vast',
    hirelings: 1,
    order: 'recruit',
    orderOptions: [
      {
        key: 'adventurers',
        label: "Adventurers' assignment",
        summary:
          'Slay or capture a Beast of CR 2 or lower within 50 miles, done in 1d6 + 1 days.',
        durationDays: null,
        costGp: null,
      },
      {
        key: 'bakers',
        label: "Bakers' assignment",
        summary: '500 GP worth of baked goods, or a favour, within 7 days.',
        durationDays: 7,
        costGp: null,
      },
      {
        key: 'brewers',
        label: "Brewers' assignment",
        summary: '50 barrels of ale, 10 GP each.',
        durationDays: 7,
        costGp: null,
        yields: { name: 'Barrel of ale', quantity: 50 },
      },
      {
        key: 'masons',
        label: "Masons' assignment",
        summary:
          "Defensive walls at no cost, 1 day per 5-ft square. Also for an ally's bastion within 1 mile.",
        durationDays: null,
        costGp: null,
      },
      {
        key: 'shipbuilders',
        label: "Shipbuilders' assignment",
        summary: 'Builds a vehicle at full price, 1 day per 1,000 GP.',
        durationDays: null,
        costGp: null,
      },
      {
        key: 'thieves',
        label: "Thieves' assignment",
        summary:
          'Steals a nonmagical object within 50 miles, delivered in 1d6 + 1 days.',
        durationDays: null,
        costGp: null,
      },
    ],
    benefits: ['About 50 guild members; one assignment per order.'],
    variant: {
      label: 'Guild',
      options: [
        "Adventurers' Guild",
        "Bakers' Guild",
        "Brewers' Guild",
        "Masons' Guild",
        "Shipbuilders' Guild",
        "Thieves' Guild",
      ],
    },
  },
  {
    key: 'sanctum',
    name: 'Sanctum',
    level: 17,
    prerequisite: 'holy-or-druidic-focus',
    space: 'roomy',
    hirelings: 4,
    order: 'empower',
    orderOptions: [
      {
        key: 'fortifying-rites',
        label: 'Fortifying rites',
        summary:
          'For 7 days, a named creature anywhere gains Temporary Hit Points equal to your level after each Long Rest.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'Long Rest here: gain a charm of Heal, lasting 7 days.',
      'Word of Recall always prepared, able to target the Sanctum; one arrival gets Heal.',
    ],
  },
  {
    key: 'war-room',
    name: 'War Room',
    level: 17,
    prerequisite: 'fighting-style-or-unarmored-defense',
    space: 'vast',
    hirelings: 2,
    order: 'recruit',
    orderOptions: [
      {
        key: 'lieutenant',
        label: 'Recruit a lieutenant',
        summary: 'One Veteran Warrior lieutenant joins; at most 10.',
        durationDays: 7,
        costGp: null,
      },
      {
        key: 'soldiers',
        label: 'Muster soldiers',
        summary:
          'Each lieutenant raises 100 Guards (or 20 mounted); 1 GP per guard and per horse per day. Disbands if unled or unfed for a day.',
        durationDays: 7,
        costGp: null,
      },
    ],
    benefits: [
      'Lieutenants are hirelings, not defenders; each one housed removes 1 die from Attack loss rolls.',
    ],
  },
];

export const specialFacilityByKey: Readonly<
  Record<string, SpecialFacilityDefinition>
> = Object.fromEntries(
  specialFacilities.map(facility => [facility.key, facility]),
);

export const findSpecialFacility = (
  key: string,
): SpecialFacilityDefinition | undefined =>
  Object.hasOwn(specialFacilityByKey, key)
    ? specialFacilityByKey[key]
    : undefined;
