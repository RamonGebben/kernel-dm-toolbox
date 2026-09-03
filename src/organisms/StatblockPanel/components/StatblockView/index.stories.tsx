import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { StatblockView } from '~/organisms/StatblockPanel/components/StatblockView';
import type { Statblock } from '~/server/trpc/helpers/buildStatblock';

/** The young black dragon, matching the reference screenshot. */
const youngBlackDragon: Statblock = {
  slug: 'srd-2024_young-black-dragon',
  name: 'Young Black Dragon',
  subtitle: 'Large Dragon, chaotic evil',
  armorClass: 18,
  armorDetail: 'natural armor',
  hitPoints: 127,
  hitDice: '15d10 + 45',
  initiativeBonus: 5,
  challengeRatingLabel: '7',
  experiencePoints: 2900,
  proficiencyBonus: 3,
  speed: 'walk 40 ft., swim 40 ft., fly 80 ft.',
  senses: 'darkvision 120 ft., blindsight 30 ft., passive Perception 16',
  languages: 'Common, Draconic',
  abilities: [
    { key: 'STR', label: 'Strength', score: 19, modifier: '+4' },
    { key: 'DEX', label: 'Dexterity', score: 14, modifier: '+2' },
    { key: 'CON', label: 'Constitution', score: 17, modifier: '+3' },
    { key: 'INT', label: 'Intelligence', score: 12, modifier: '+1' },
    { key: 'WIS', label: 'Wisdom', score: 11, modifier: '+0' },
    { key: 'CHA', label: 'Charisma', score: 15, modifier: '+2' },
  ],
  savingThrows: [
    { label: 'Strength', value: '+4' },
    { label: 'Dexterity', value: '+5' },
    { label: 'Constitution', value: '+3' },
    { label: 'Intelligence', value: '+1' },
    { label: 'Wisdom', value: '+3' },
    { label: 'Charisma', value: '+2' },
  ],
  skills: [
    { label: 'Perception', value: '+6' },
    { label: 'Stealth', value: '+5' },
  ],
  damageImmunities: 'acid',
  damageResistances: null,
  damageVulnerabilities: null,
  conditionImmunities: null,
  traits: [
    {
      slug: 'amphibious',
      name: 'Amphibious',
      desc: 'The dragon can breathe air and water.',
    },
  ],
  actionSections: [
    {
      key: 'ACTION',
      title: 'Actions',
      actions: [
        {
          slug: 'acid-breath',
          name: 'Acid Breath',
          desc: 'Dexterity Saving Throw: DC 14, each creature in a 30-foot-long, 5-foot-wide Line. Failure: 49 (14d6) Acid damage. Success: Half damage.',
          legendaryActionCost: null,
        },
        {
          slug: 'multiattack',
          name: 'Multiattack',
          desc: 'The dragon makes three Rend attacks.',
          legendaryActionCost: null,
        },
      ],
    },
  ],
};

const meta = {
  title: 'Organisms/StatblockPanel/StatblockView',
  component: StatblockView,
  args: { isPending: false, statblock: youngBlackDragon },
} satisfies Meta<typeof StatblockView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('heading', { name: 'Young Black Dragon' }),
    ).toBeVisible();
    await expect(canvas.getByText(/127 \(15d10 \+ 45\)/)).toBeVisible();
    await expect(canvas.getByText(/2,900 XP/)).toBeVisible();
  },
};

export const Pending: Story = {
  args: { isPending: true, statblock: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Loading statblock')).toBeVisible();
  },
};

export const NothingSelected: Story = {
  args: { statblock: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Nothing selected')).toBeVisible();
  },
};

/** Rows with nothing to show are omitted rather than rendered blank. */
export const SparseCreature: Story = {
  args: {
    statblock: {
      ...youngBlackDragon,
      name: 'Goblin',
      subtitle: 'Small Humanoid, chaotic neutral',
      challengeRatingLabel: '1/8',
      experiencePoints: 25,
      proficiencyBonus: 2,
      savingThrows: [],
      skills: [],
      damageImmunities: null,
      languages: null,
      traits: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText(/^Saves/)).not.toBeInTheDocument();
    await expect(canvas.queryByText('Traits')).not.toBeInTheDocument();
    await expect(canvas.getByText(/1\/8 \(25 XP\)/)).toBeVisible();
  },
};

export const WithLegendaryActions: Story = {
  args: {
    statblock: {
      ...youngBlackDragon,
      actionSections: [
        ...youngBlackDragon.actionSections,
        {
          key: 'LEGENDARY_ACTION',
          title: 'Legendary Actions',
          actions: [
            {
              slug: 'pounce',
              name: 'Pounce',
              desc: 'The dragon moves and makes one Rend attack.',
              legendaryActionCost: 2,
            },
          ],
        },
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Costs 2 Actions/)).toBeVisible();
  },
};
