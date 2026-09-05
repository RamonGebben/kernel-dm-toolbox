import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SpellLibraryView } from '~/organisms/SpellLibrary/components/SpellLibraryView';

const spells = [
  { slug: 'srd-2024_fireball', name: 'Fireball', levelLabel: '3rd-level', school: 'Evocation' },
  { slug: 'srd-2024_guidance', name: 'Guidance', levelLabel: 'Cantrip', school: 'Divination' },
  { slug: 'srd-2024_hold-person', name: 'Hold Person', levelLabel: '2nd-level', school: 'Enchantment' },
];

const meta = {
  title: 'Organisms/SpellLibrary/SpellLibraryView',
  component: SpellLibraryView,
  args: {
    isPending: false,
    isLibraryImported: true,
    spells,
    search: '',
    selectedSlug: null,
    onSearchChange: fn(),
    onSelect: fn(),
  },
} satisfies Meta<typeof SpellLibraryView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Show the Fireball description' }),
    );

    await expect(args.onSelect).toHaveBeenCalledWith('srd-2024_fireball');
  },
};

export const Pending: Story = {
  args: { isPending: true, spells: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Loading spells')).toBeVisible();
  },
};

/** The state when the boot-time import has not (yet) succeeded here. */
export const LibraryNotImported: Story = {
  args: { isLibraryImported: false, spells: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No library yet')).toBeVisible();
    await expect(canvas.getByText('pnpm db:import')).toBeVisible();
    await expect(canvas.getByLabelText('Filter spells')).toBeDisabled();
  },
};

export const NoMatches: Story = {
  args: { spells: [], search: 'wish' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No matches')).toBeVisible();
  },
};

export const Selected: Story = {
  args: { selectedSlug: 'srd-2024_guidance' },
};

export const Filtering: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Filter spells'), 'fire');

    await expect(args.onSearchChange).toHaveBeenCalled();
  },
};
