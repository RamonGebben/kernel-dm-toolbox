import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import {
  CreatureLibraryView,
  type CreatureSummary,
} from '~/organisms/CreatureLibrary/components/CreatureLibraryView';

const creatures: CreatureSummary[] = [
  {
    source: 'library',
    slug: 'srd-2024_aboleth',
    name: 'Aboleth',
    challengeRatingLabel: '10',
  },
  {
    source: 'library',
    slug: 'srd-2024_young-black-dragon',
    name: 'Young Black Dragon',
    challengeRatingLabel: '7',
  },
  {
    source: 'library',
    slug: 'srd-2024_goblin',
    name: 'Goblin',
    challengeRatingLabel: '1/8',
  },
  {
    source: 'custom',
    id: 'custom-goblin-boss',
    name: 'Goblin Boss (homebrew)',
    challengeRatingLabel: '1',
  },
];

const sourceOptions = [
  { value: 'library', label: 'Library' },
  { value: 'custom', label: 'Custom' },
];

const typeOptions = [
  { value: 'aberration', label: 'Aberration' },
  { value: 'dragon', label: 'Dragon' },
  { value: 'humanoid', label: 'Humanoid' },
  { value: 'undead', label: 'Undead' },
];

const documentOptions = [
  { value: 'a5e-mm', label: 'Monstrous Menagerie' },
  { value: 'srd-2024', label: 'System Reference Document 5.2' },
];

const meta = {
  title: 'Organisms/CreatureLibrary/CreatureLibraryView',
  component: CreatureLibraryView,
  args: {
    isPending: false,
    isLibraryImported: true,
    creatures,
    search: '',
    sourceOptions,
    selectedSources: [],
    typeOptions,
    selectedTypes: [],
    documentOptions,
    selectedDocuments: [],
    selectedSlug: null,
    selectedCustomCreatureId: null,
    onSearchChange: fn(),
    onSourcesChange: fn(),
    onTypesChange: fn(),
    onDocumentsChange: fn(),
    onSelect: fn(),
    onAdd: fn(),
    onNewCreature: fn(),
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

    await expect(args.onSelect).toHaveBeenCalledWith(creatures[0]);
  },
};

export const Pending: Story = {
  args: { isPending: true, creatures: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Loading creatures')).toBeVisible();
  },
};

/** The state when the boot-time import has not (yet) succeeded here. */
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

export const CustomCreatureSelected: Story = {
  args: { selectedCustomCreatureId: 'custom-goblin-boss' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // A custom creature renders like any other row — no distinguishing
    // label — it just carries the selected state like a library one would.
    await expect(
      canvas.getByRole('button', {
        name: 'Show the Goblin Boss (homebrew) statblock',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const FilteringByType: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Type' }));
    // The checkbox list is portalled to `document.body`, so it's found via
    // `screen`, not `canvas` — see `MultiSelectFilter`'s own doc comment.
    await userEvent.click(screen.getByRole('checkbox', { name: 'Dragon' }));

    await expect(args.onTypesChange).toHaveBeenCalledWith(['dragon']);
  },
};

export const FilteringByBook: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Book' }));
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Monstrous Menagerie' }),
    );

    await expect(args.onDocumentsChange).toHaveBeenCalledWith(['a5e-mm']);
  },
};

/** Narrowing to Custom makes the Book filter meaningless — disable it. */
export const CustomSourceDisablesBook: Story = {
  args: { selectedSources: ['custom'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: 'Book' })).toBeDisabled();
  },
};

export const Adding: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Add Goblin to the encounter' }),
    );

    await expect(args.onAdd).toHaveBeenCalledWith(creatures[2]);
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

export const OpeningNewCreatureWizard: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'New Creature' }));

    await expect(args.onNewCreature).toHaveBeenCalledOnce();
  },
};
