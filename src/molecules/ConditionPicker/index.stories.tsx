import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ConditionPicker } from '~/molecules/ConditionPicker';

const meta = {
  title: 'Molecules/ConditionPicker',
  component: ConditionPicker,
  args: {
    options: [
      { slug: 'srd-2024_poisoned', name: 'Poisoned' },
      { slug: 'srd-2024_prone', name: 'Prone' },
      { slug: 'srd-2024_stunned', name: 'Stunned' },
    ],
    isPending: false,
    onApply: fn(),
  },
} satisfies Meta<typeof ConditionPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Blank duration means indefinite, which is the common case. */
export const AppliesIndefinitely: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(
      canvas.getByLabelText('Condition'),
      'srd-2024_prone',
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));

    await expect(args.onApply).toHaveBeenCalledWith({
      conditionSlug: 'srd-2024_prone',
      roundsRemaining: null,
    });
  },
};

export const AppliesWithADuration: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(
      canvas.getByLabelText('Condition'),
      'srd-2024_poisoned',
    );
    await userEvent.type(canvas.getByLabelText('Rounds'), '3');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));

    await expect(args.onApply).toHaveBeenCalledWith({
      conditionSlug: 'srd-2024_poisoned',
      roundsRemaining: 3,
    });
  },
};

/** Nothing chosen: applying is unavailable rather than a silent no-op. */
export const NothingChosen: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: 'Apply' })).toBeDisabled();
  },
};

/** Before `pnpm db:import` there are no conditions to choose from. */
export const NoLibrary: Story = {
  args: { options: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Condition')).toBeDisabled();
  },
};
