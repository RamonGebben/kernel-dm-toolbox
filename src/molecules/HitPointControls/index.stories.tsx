import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { HitPointControls } from '~/molecules/HitPointControls';

const meta = {
  title: 'Molecules/HitPointControls',
  component: HitPointControls,
  args: {
    currentHitPoints: 52,
    maxHitPoints: 52,
    temporaryHitPoints: 0,
    isPending: false,
    onDamage: fn(),
    onHeal: fn(),
    onGrantTemporary: fn(),
  },
} satisfies Meta<typeof HitPointControls>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nothing typed yet: every action is unavailable rather than a silent no-op. */
export const Idle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: 'Damage' })).toBeDisabled();
    await expect(canvas.getByRole('button', { name: 'Heal' })).toBeDisabled();
  },
};

export const ApplyingDamage: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Amount'), '17');
    await userEvent.click(canvas.getByRole('button', { name: 'Damage' }));

    await expect(args.onDamage).toHaveBeenCalledWith(17);
    // The field clears, so the next number is not accidentally appended.
    await expect(canvas.getByLabelText('Amount')).toHaveValue(null);
  },
};

export const Healing: Story = {
  args: { currentHitPoints: 20 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Amount'), '8');
    await userEvent.click(canvas.getByRole('button', { name: 'Heal' }));

    await expect(args.onHeal).toHaveBeenCalledWith(8);
  },
};

export const GrantingTemporary: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Amount'), '10');
    await userEvent.click(canvas.getByRole('button', { name: 'Temp' }));

    await expect(args.onGrantTemporary).toHaveBeenCalledWith(10);
  },
};

export const WithTemporaryHitPoints: Story = {
  args: { temporaryHitPoints: 10 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('+10 temp')).toBeVisible();
  },
};

/** Zero and negatives are rejected before they reach the API. */
export const RejectsNonsense: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Amount'), '0');

    await expect(canvas.getByRole('button', { name: 'Damage' })).toBeDisabled();
    await expect(args.onDamage).not.toHaveBeenCalled();
  },
};
