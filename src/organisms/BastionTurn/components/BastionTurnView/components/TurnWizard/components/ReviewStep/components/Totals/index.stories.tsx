import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Totals } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep/components/Totals';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/ReviewStep/Totals',
  component: Totals,
  args: {
    children: 'Totals',
  },
} satisfies Meta<typeof Totals>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
