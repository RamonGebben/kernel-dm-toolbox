import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DefensesSection } from '~/organisms/BastionDetail/components/BastionDetailView/components/DefensesSection';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/DefensesSection',
  component: DefensesSection,
  args: {
    defenderCount: 6,
    defenderCapacity: 12,
    wallSquares: 0,
    isFullyEnclosed: false,
    treasuryGold: 5000,
    onSetDefenders: fn(),
    onBuildWalls: fn(),
  },
} satisfies Meta<typeof DefensesSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Recruiting: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('barracks house 12')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'One more defender' }),
    );

    await expect(args.onSetDefenders).toHaveBeenCalledWith(7);
  },
};

export const NoBarrack: Story = {
  args: { defenderCount: 0, defenderCapacity: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('no Barrack to house them')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'One fewer defender' }),
    ).toBeDisabled();
  },
};

export const OverCapacity: Story = {
  args: { defenderCount: 14 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/more than the barracks hold/)).toBeVisible();
  },
};

export const BuildingWalls: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Build wall'), '4');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Build (1,000 gp, 40 days)' }),
    );

    await expect(args.onBuildWalls).toHaveBeenCalledWith(4);
  },
};

export const Walled: Story = {
  args: { wallSquares: 40, isFullyEnclosed: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('40 squares · fully enclosed')).toBeVisible();
  },
};
