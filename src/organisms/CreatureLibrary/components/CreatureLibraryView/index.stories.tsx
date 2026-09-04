import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CreatureLibraryView } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';

const creatures = [
  { slug: 'srd-2024_aboleth', name: 'Aboleth', challengeRatingLabel: '10' },
  {
    slug: 'srd-2024_young-black-dragon',
    name: 'Young Black Dragon',
    challengeRatingLabel: '7',
  },
  { slug: 'srd-2024_goblin', name: 'Goblin', challengeRatingLabel: '1/8' },
];

const meta = {
  title: 'Organisms/CreatureLibrary/CreatureLibraryView',
  component: CreatureLibraryView,
  args: {
    isPending: false,
    isLibraryImported: true,
    creatures,
    search: '',
    selectedSlug: null,
    quantity: 1,
    onSearchChange: fn(),
    onQuantityChange: fn(),
    onSelect: fn(),
    onAdd: fn(),
  },
} satisfies Meta<typeof CreatureLibraryView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Show the Aboleth statblock' }),
    );

    await expect(args.onSelect).toHaveBeenCalledWith('srd-2024_aboleth');
  },
};

export const Pending: Story = {
  args: { isPending: true, creatures: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Loading creatures')).toBeVisible();
  },
};

/** The state before `pnpm db:import` has ever run on this instance. */
export const LibraryNotImported: Story = {
  args: { isLibraryImported: false, creatures: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No library yet')).toBeVisible();
    await expect(canvas.getByText('pnpm db:import')).toBeVisible();
    // Filtering an empty library is meaningless, so the box is disabled.
    await expect(canvas.getByLabelText('Filter creatures')).toBeDisabled();
  },
};

export const NoMatches: Story = {
  args: { creatures: [], search: 'tarrasque' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No matches')).toBeVisible();
  },
};

export const Selected: Story = {
  args: { selectedSlug: 'srd-2024_goblin' },
};

/** Adding four goblins at once is the common case the quantity field serves. */
export const AddingAGroup: Story = {
  args: { quantity: 4 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('How many to add')).toHaveValue(4);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Add Goblin to the encounter' }),
    );

    await expect(args.onAdd).toHaveBeenCalledWith('srd-2024_goblin');
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};

export const Filtering: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Filter creatures'), 'dra');

    await expect(args.onSearchChange).toHaveBeenCalled();
  },
};
