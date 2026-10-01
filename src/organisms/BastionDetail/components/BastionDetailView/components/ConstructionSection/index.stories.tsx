import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ConstructionSection } from '~/organisms/BastionDetail/components/BastionDetailView/components/ConstructionSection';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/ConstructionSection',
  component: ConstructionSection,
  args: {
    projects: [
      {
        id: 'p1',
        kind: 'add-basic',
        description: 'Build a Roomy Parlor',
        costGp: 1000,
        daysRemaining: 45,
      },
    ],
    onFinish: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof ConstructionSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const UnderWay: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('45 days left · paid 1,000 gp'),
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Finish now: Build a Roomy Parlor' }),
    );

    await expect(args.onFinish).toHaveBeenCalledWith('p1');
  },
};

export const CancellingRefunds: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Cancel: Build a Roomy Parlor' }),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Cancel and refund 1,000 gp' }),
    );

    await expect(args.onCancel).toHaveBeenCalledWith('p1');
  },
};

export const Idle: Story = {
  args: { projects: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Nothing under construction.')).toBeVisible();
  },
};
