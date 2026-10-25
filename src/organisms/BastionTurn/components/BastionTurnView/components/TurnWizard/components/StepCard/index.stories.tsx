import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StepCard } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/StepCard';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/StepCard',
  component: StepCard,
  args: {
    children: 'StepCard',
  },
} satisfies Meta<typeof StepCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
