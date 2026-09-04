import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ConditionBadges } from '~/molecules/ConditionBadges';

const meta = {
  title: 'Molecules/ConditionBadges',
  component: ConditionBadges,
  args: {
    conditions: [
      { id: '1', name: 'Poisoned', roundsRemaining: 3, note: null },
      { id: '2', name: 'Prone', roundsRemaining: null, note: null },
    ],
    onRemove: fn(),
  },
} satisfies Meta<typeof ConditionBadges>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Poisoned')).toBeVisible();
    // The countdown is what gets said out loud; indefinite shows no number.
    await expect(canvas.getByText('3')).toBeVisible();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Poisoned' }),
    );
    await expect(args.onRemove).toHaveBeenCalledWith('1');
  },
};

/** In the initiative row there is nothing to click, only something to read. */
export const ReadOnly: Story = {
  args: { onRemove: undefined },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByRole('button')).not.toBeInTheDocument();
  },
};

export const WithANote: Story = {
  args: {
    conditions: [
      {
        id: '1',
        name: 'Charmed',
        roundsRemaining: 10,
        note: 'concentrating on Hold Person',
      },
    ],
  },
};

/** Renders nothing at all rather than an empty container. */
export const None: Story = {
  args: { conditions: [] },
};
