import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CombatantRow } from '~/molecules/CombatantRow';

const meta = {
  title: 'Molecules/CombatantRow',
  component: CombatantRow,
  args: {
    displayName: 'Meat',
    initiative: 19,
    currentHitPoints: 35,
    maxHitPoints: 52,
    temporaryHitPoints: 0,
    armorClass: 18,
    isSelected: false,
    isHidden: false,
    isActive: false,
    isDelayed: false,
    onSelect: fn(),
    onToggleDelay: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof CombatantRow>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The four rows from the reference screenshot. */
export const Damaged: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('35/52')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Select Meat' }));
    await expect(args.onSelect).toHaveBeenCalledOnce();
  },
};

export const Downed: Story = {
  args: {
    displayName: 'Young Black Dragon',
    initiative: 17,
    currentHitPoints: 0,
    maxHitPoints: 127,
    isSelected: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('0/127')).toBeVisible();
  },
};

export const AtFullHealth: Story = {
  args: {
    displayName: 'Sigrid',
    initiative: 10,
    currentHitPoints: 45,
    maxHitPoints: 45,
    armorClass: 20,
  },
};

export const WithTemporaryHitPoints: Story = {
  args: { temporaryHitPoints: 8 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('+8')).toBeVisible();
  },
};

export const ActiveTurn: Story = {
  args: { isActive: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('turn')).toBeVisible();
  },
};

export const Delayed: Story = {
  args: { isDelayed: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('delayed')).toBeVisible();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Return Meat to the order' }),
    );
    await expect(args.onToggleDelay).toHaveBeenCalledOnce();
  },
};

export const Hidden: Story = {
  args: { displayName: 'Assassin', isHidden: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('hidden')).toBeVisible();
  },
};

/** Removing must not also select the row it was clicked inside. */
export const Removing: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Remove Meat' }));

    await expect(args.onRemove).toHaveBeenCalledOnce();
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};
