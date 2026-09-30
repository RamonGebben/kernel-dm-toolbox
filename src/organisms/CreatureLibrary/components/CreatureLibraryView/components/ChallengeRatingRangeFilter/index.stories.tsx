import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ChallengeRatingRangeFilter } from '~/organisms/CreatureLibrary/components/CreatureLibraryView/components/ChallengeRatingRangeFilter';

const options = [
  { value: 0, label: '0' },
  { value: 0.125, label: '1/8' },
  { value: 0.25, label: '1/4' },
  { value: 0.5, label: '1/2' },
  { value: 1, label: '1' },
  { value: 5, label: '5' },
];

const meta = {
  title:
    'Organisms/CreatureLibrary/CreatureLibraryView/ChallengeRatingRangeFilter',
  component: ChallengeRatingRangeFilter,
  args: {
    options,
    range: { min: null, max: null },
    onMinChange: fn(),
    onMaxChange: fn(),
    disabled: false,
  },
} satisfies Meta<typeof ChallengeRatingRangeFilter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Unset: Story = {};

export const RangeSet: Story = {
  args: { range: { min: 0.5, max: 5 } },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByLabelText('Minimum challenge rating'),
    ).toBeDisabled();
    await expect(
      canvas.getByLabelText('Maximum challenge rating'),
    ).toBeDisabled();
  },
};

/** Picking "Any" again clears the bound back to null, not to 0. */
export const ClearingABound: Story = {
  args: { range: { min: 1, max: null } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(
      canvas.getByLabelText('Minimum challenge rating'),
      'Any',
    );

    await expect(args.onMinChange).toHaveBeenCalledWith(null);
  },
};
