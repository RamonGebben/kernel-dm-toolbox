import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { SpellDetailView } from '~/organisms/SpellDetailPanel/components/SpellDetailView';
import type { SpellDetail } from '~/server/trpc/helpers/buildSpellDetail';

const fireball: SpellDetail = {
  slug: 'srd-2024_fireball',
  name: 'Fireball',
  subtitle: '3rd-level Evocation',
  levelLabel: '3rd-level',
  school: 'Evocation',
  castingTime: '1 Action',
  reactionCondition: null,
  rangeLabel: '150 feet',
  componentsLabel:
    'V, S, M (a tiny ball of bat guano and sulfur, which the spell consumes)',
  durationLabel: 'Instantaneous',
  ritual: false,
  concentration: false,
  targetLabel: 'Area',
  shapeLabel: '20-feet Sphere',
  savingThrowLabel: 'Dexterity save',
  attackRoll: false,
  damageRoll: '8d6',
  damageTypes: ['fire'],
  classes: ['Sorcerer', 'Wizard'],
  desc: 'A bright streak flashes from your pointing finger to a point you choose, then blossoms with a low roar into an explosion of flame.',
  higherLevel: 'The damage increases by 1d6 for each spell slot level above 3rd.',
  castingOptions: [
    {
      id: 'opt-4',
      label: '4th-level Slot',
      desc: null,
      damageRoll: '9d6',
      duration: null,
      range: null,
      targetCount: null,
      shapeSize: null,
      concentration: null,
    },
  ],
};

const guidance: SpellDetail = {
  slug: 'srd-2024_guidance',
  name: 'Guidance',
  subtitle: 'Divination Cantrip',
  levelLabel: 'Cantrip',
  school: 'Divination',
  castingTime: '1 Action',
  reactionCondition: null,
  rangeLabel: 'Touch',
  componentsLabel: 'V, S',
  durationLabel: 'Concentration, up to 1 minute',
  ritual: false,
  concentration: true,
  targetLabel: null,
  shapeLabel: null,
  savingThrowLabel: null,
  attackRoll: false,
  damageRoll: null,
  damageTypes: [],
  classes: ['Cleric', 'Druid'],
  desc: 'You touch one willing creature. Once before the spell ends, the target can roll a d4 and add the number rolled to one ability check of its choice.',
  higherLevel: null,
  castingOptions: [],
};

const meta = {
  title: 'Organisms/SpellDetailPanel/SpellDetailView',
  component: SpellDetailView,
  args: {
    isPending: false,
    spell: fireball,
  },
} satisfies Meta<typeof SpellDetailView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('3rd-level Evocation')).toBeVisible();
    await expect(canvas.getByText(/8d6/)).toBeVisible();
  },
};

export const CantripWithConcentration: Story = {
  args: { spell: guidance },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('Concentration, up to 1 minute'),
    ).toBeVisible();
  },
};

export const Pending: Story = {
  args: { isPending: true, spell: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Loading spell')).toBeVisible();
  },
};

export const NotFound: Story = {
  args: { spell: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Not found')).toBeVisible();
  },
};
