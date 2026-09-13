import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BasePicker } from '~/organisms/NewCreatureWizard/components/BasePicker';
import type { CreatureSummary } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';

const creatures: CreatureSummary[] = [
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

const meta = {
  title: 'Organisms/NewCreatureWizard/BasePicker',
  component: BasePicker,
  args: {
    search: '',
    creatures,
    isPending: false,
    onSearchChange: fn(),
    onChoose: fn(),
  },
} satisfies Meta<typeof BasePicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {};

export const StartingBlank: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Start blank' }));

    await expect(args.onChoose).toHaveBeenCalledWith({ kind: 'blank' });
  },
};

export const CopyingFromLibrary: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const [useAsBase] = canvas.getAllByRole('button', { name: 'Use as base' });

    await userEvent.click(useAsBase);

    await expect(args.onChoose).toHaveBeenCalledWith({
      kind: 'library',
      slug: 'srd-2024_goblin',
    });
  },
};

export const CopyingFromCustom: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const [, customUseAsBase] = canvas.getAllByRole('button', {
      name: 'Use as base',
    });

    await userEvent.click(customUseAsBase);

    await expect(args.onChoose).toHaveBeenCalledWith({
      kind: 'custom',
      id: 'custom-goblin-boss',
    });
  },
};

export const Pending: Story = {
  args: { isPending: true, creatures: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Loading creatures')).toBeVisible();
  },
};

export const NoMatches: Story = {
  args: { creatures: [], search: 'tarrasque' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No matches')).toBeVisible();
  },
};
