import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import {
  CreatureLibraryView,
  type CreatureSummary,
} from '~/organisms/CreatureLibrary/components/CreatureLibraryView';

const creatures: Array<CreatureSummary> = [
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

const challengeRatingOptions = [
  { value: 0, label: '0' },
  { value: 0.125, label: '1/8' },
  { value: 0.25, label: '1/4' },
  { value: 0.5, label: '1/2' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 7, label: '7' },
  { value: 10, label: '10' },
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
    challengeRatingOptions,
    challengeRatingRange: { min: null, max: null },
    selectedSlug: null,
    selectedCustomCreatureId: null,
    onSearchChange: fn(),
    onSourcesChange: fn(),
    onTypesChange: fn(),
    onDocumentsChange: fn(),
    onMinChallengeRatingChange: fn(),
    onMaxChallengeRatingChange: fn(),
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

/** With nothing applied, every filter hides behind one "+ Filter" button. */
export const FiltersCollapsed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: '+ Filter' }),
    ).toBeVisible();
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
    await expect(
      canvas.queryByLabelText('Minimum challenge rating'),
    ).not.toBeInTheDocument();
  },
};

export const FilteringByType: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: '+ Filter' }));
    // The popover is portalled to `document.body`, so it's found via
    // `screen`, not `canvas` — see `FilterBar`'s own doc comment.
    await userEvent.click(screen.getByRole('button', { name: 'Type' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Dragon' }));

    await expect(args.onTypesChange).toHaveBeenCalledWith(['dragon']);
  },
};

export const FilteringByBook: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: '+ Filter' }));
    await userEvent.click(screen.getByRole('button', { name: 'Book' }));
    await userEvent.click(
      screen.getByRole('checkbox', { name: 'Monstrous Menagerie' }),
    );

    await expect(args.onDocumentsChange).toHaveBeenCalledWith(['a5e-mm']);
  },
};

export const FilteringByChallengeRating: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: '+ Filter' }));
    await userEvent.click(screen.getByRole('button', { name: 'CR' }));
    await userEvent.selectOptions(
      screen.getByLabelText('Minimum challenge rating'),
      '1/4',
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Maximum challenge rating'),
      '2',
    );

    await expect(args.onMinChallengeRatingChange).toHaveBeenCalledWith(0.25);
    await expect(args.onMaxChallengeRatingChange).toHaveBeenCalledWith(2);
  },
};

/** Applied filters collapse into tags that summarise their value. */
export const FiltersApplied: Story = {
  args: {
    selectedTypes: ['dragon', 'undead', 'aberration'],
    challengeRatingRange: { min: 0.125, max: 1 },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Type: Aberration, Dragon +1' }),
    ).toBeVisible();
    await userEvent.click(canvas.getByRole('button', { name: 'CR: 1/8–1' }));

    await expect(
      screen.getByLabelText('Minimum challenge rating'),
    ).toHaveDisplayValue('1/8');
    await expect(
      screen.getByLabelText('Maximum challenge rating'),
    ).toHaveDisplayValue('1');
  },
};

export const RemovingAFilter: Story = {
  args: { challengeRatingRange: { min: 2, max: null } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove CR filter' }),
    );

    await expect(args.onMinChallengeRatingChange).toHaveBeenCalledWith(null);
    await expect(args.onMaxChallengeRatingChange).toHaveBeenCalledWith(null);
  },
};

/** Narrowing to Custom makes the Book filter meaningless — disable it. */
export const CustomSourceDisablesBook: Story = {
  args: { selectedSources: ['custom'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: '+ Filter' }));

    await expect(screen.getByRole('button', { name: 'Book' })).toBeDisabled();
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
