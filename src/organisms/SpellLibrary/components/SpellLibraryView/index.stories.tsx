import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SpellLibraryView } from '~/organisms/SpellLibrary/components/SpellLibraryView';

const spells = [
  { slug: 'srd-2024_fireball', name: 'Fireball', levelLabel: '3rd-level', school: 'Evocation' },
  { slug: 'srd-2024_guidance', name: 'Guidance', levelLabel: 'Cantrip', school: 'Divination' },
  { slug: 'srd-2024_hold-person', name: 'Hold Person', levelLabel: '2nd-level', school: 'Enchantment' },
];

const levelOptions = [
  { value: '0', label: 'Cantrip' },
  { value: '1', label: '1st-level' },
  { value: '2', label: '2nd-level' },
  { value: '3', label: '3rd-level' },
];

const classOptions = [
  { value: 'srd-2024_bard', label: 'Bard' },
  { value: 'srd-2024_wizard', label: 'Wizard' },
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
    levelOptions,
    selectedLevels: [],
    onLevelsChange: fn(),
    classOptions,
    selectedClassSlugs: [],
    onClassSlugsChange: fn(),
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

/** Several levels and several classes can be checked at once. */
export const FilteringByLevelAndClass: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /level/i }));
    await userEvent.click(canvas.getByRole('checkbox', { name: '1st-level' }));
    await expect(args.onLevelsChange).toHaveBeenCalledWith(['1']);

    await userEvent.click(canvas.getByRole('button', { name: /class/i }));
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Bard' }));
    await expect(args.onClassSlugsChange).toHaveBeenCalledWith([
      'srd-2024_bard',
    ]);
  },
};

export const WithActiveFilters: Story = {
  args: { selectedLevels: ['1', '2'], selectedClassSlugs: ['srd-2024_wizard'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: /level \(2\)/i }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: /class \(1\)/i }),
    ).toBeVisible();
  },
};
