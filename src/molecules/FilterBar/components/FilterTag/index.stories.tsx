import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { FilterTag } from '~/molecules/FilterBar/components/FilterTag';

const meta = {
  title: 'Molecules/FilterBar/FilterTag',
  component: FilterTag,
  args: {
    label: 'Type',
    summary: 'Dragon, Undead',
    isEditing: false,
    disabled: false,
    onEdit: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof FilterTag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Applied: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Type: Dragon, Undead' }),
    );

    await expect(args.onEdit).toHaveBeenCalledOnce();
  },
};

export const Editing: Story = {
  args: { isEditing: true },
};

/** Freshly picked from the menu, nothing chosen yet. */
export const BeingSetUp: Story = {
  args: { summary: null, isEditing: true },
};

export const Removing: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Type filter' }),
    );

    await expect(args.onRemove).toHaveBeenCalledOnce();
    await expect(args.onEdit).not.toHaveBeenCalled();
  },
};

/** A disabled filter can't be edited, but can still be removed. */
export const Disabled: Story = {
  args: { label: 'Book', summary: 'Tome of Beasts', disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Book: Tome of Beasts' }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole('button', { name: 'Remove Book filter' }),
    ).toBeEnabled();
  },
};
