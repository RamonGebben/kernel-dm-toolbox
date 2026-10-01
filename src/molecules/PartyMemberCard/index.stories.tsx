import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PartyMemberCard } from '~/molecules/PartyMemberCard';

const meta = {
  title: 'Molecules/PartyMemberCard',
  component: PartyMemberCard,
  args: {
    name: 'Sigrid',
    playerName: 'Anna',
    level: 5,
    className: 'Paladin',
    subclass: 'Oath of Glory',
    species: 'Goliath',
    armorClass: 20,
    maxHitPoints: 45,
    initiativeModifier: 2,
    passivePerception: 13,
    passiveInsight: 11,
    passiveInvestigation: 10,
    gold: 1250,
    notes: 'Owes the Harpers a favour.',
    isActive: true,
    isUpdating: false,
    onEdit: fn(),
    onToggleActive: fn(),
  },
} satisfies Meta<typeof PartyMemberCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(
        'Level 5 Goliath Paladin · Oath of Glory · played by Anna',
      ),
    ).toBeVisible();
    await expect(canvas.getByText('1,250 gp')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Edit Sigrid' }));
    await expect(args.onEdit).toHaveBeenCalledOnce();
  },
};

/** Entered with only the tracker's numbers: nothing reads as a fake 0. */
export const NumbersOnly: Story = {
  args: {
    playerName: null,
    className: null,
    subclass: null,
    species: null,
    passivePerception: null,
    passiveInsight: null,
    passiveInvestigation: null,
    gold: 0,
    notes: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Level 5')).toBeVisible();
    await expect(canvas.getAllByText('—')).toHaveLength(3);
  },
};

export const Benching: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Bench Sigrid' }));
    await expect(args.onToggleActive).toHaveBeenCalledOnce();
  },
};

export const Benched: Story = {
  args: { isActive: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Benched')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Recall Sigrid' }),
    ).toBeEnabled();
  },
};

export const Updating: Story = {
  args: { isUpdating: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Bench Sigrid' }),
    ).toBeDisabled();
  },
};
