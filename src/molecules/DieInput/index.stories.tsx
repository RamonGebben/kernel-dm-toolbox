import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DieInput } from '~/molecules/DieInput';

const meta = {
  title: 'Molecules/DieInput',
  component: DieInput,
  args: {
    label: "Ask Wren's player to roll",
    sides: 100,
    value: 0,
    onChange: fn(),
  },
} satisfies Meta<typeof DieInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TypingWhatWasRolled: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText(/Ask Wren's player/), '7');

    await expect(args.onChange).toHaveBeenLastCalledWith(7);
  },
};

export const RollingForSomeoneAway: Story = {
  args: { count: 2, sides: 4 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Roll 2d4 for me' }),
    );

    const [total] = (args.onChange as ReturnType<typeof fn>).mock.lastCall!;
    await expect(total).toBeGreaterThanOrEqual(2);
    await expect(total).toBeLessThanOrEqual(8);
  },
};

export const AlreadyRolled: Story = {
  args: { value: 42 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText(/Ask Wren's player/)).toHaveValue(42);
  },
};
