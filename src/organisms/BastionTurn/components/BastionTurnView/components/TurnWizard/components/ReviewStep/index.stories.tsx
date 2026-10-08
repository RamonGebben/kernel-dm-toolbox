import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { ReviewStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep';

const meta = {
  title: 'Organisms/BastionTurn/TurnWizard/ReviewStep',
  component: ReviewStep,
  args: {
    preview: {
      ok: true,
      lines: [
        'Arcane Study finished: Blank book.',
        'Sigrid rolled 53: Attack (1 defender lost).',
      ],
      treasuryDelta: -10,
      storedItems: ['Blank book'],
    },
    isPreviewing: false,
    treasuryGold: 1500,
  },
} satisfies Meta<typeof ReviewStep>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ready: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('Sigrid rolled 53: Attack (1 defender lost).'),
    ).toBeVisible();
    await expect(
      canvas.getByText(/Treasury: 1,500 gp → 1,490 gp/),
    ).toBeVisible();
    await expect(canvas.getByText('To storage: Blank book')).toBeVisible();
  },
};

export const Blocked: Story = {
  args: {
    preview: {
      ok: false,
      problems: ['Wren maintains but has no Bastion Event rolled.'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'Wren maintains but has no Bastion Event rolled.',
    );
  },
};

export const Working: Story = {
  args: { isPreviewing: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Working out the turn',
    );
  },
};
