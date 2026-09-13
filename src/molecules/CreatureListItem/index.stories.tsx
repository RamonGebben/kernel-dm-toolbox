import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CreatureListItem } from '~/molecules/CreatureListItem';

const meta = {
  title: 'Molecules/CreatureListItem',
  component: CreatureListItem,
  args: {
    name: 'Young Black Dragon',
    challengeRatingLabel: '7',
    isSelected: false,
    onSelect: fn(),
    onAdd: fn(),
  },
  argTypes: {
    isSelected: { control: 'boolean' },
    name: { control: 'text' },
    challengeRatingLabel: { control: 'text' },
  },
} satisfies Meta<typeof CreatureListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Show the Young Black Dragon statblock',
      }),
    );

    await expect(args.onSelect).toHaveBeenCalledOnce();
  },
};

export const Selected: Story = {
  args: { isSelected: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', {
        name: 'Show the Young Black Dragon statblock',
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  },
};

export const FractionalChallengeRating: Story = {
  args: { name: 'Giant Rat', challengeRatingLabel: '1/8' },
};

export const LongName: Story = {
  args: { name: 'Ancient Brass Dragon of Considerable Renown' },
};

/** Adding is a distinct action from selecting; one must not trigger the other. */
export const Adding: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', {
        name: 'Add Young Black Dragon to the encounter',
      }),
    );

    await expect(args.onAdd).toHaveBeenCalledOnce();
    await expect(args.onSelect).not.toHaveBeenCalled();
  },
};
