import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Small } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Small';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/Small',
  component: Small,
  args: {
    'aria-label': 'Small',
  },
} satisfies Meta<typeof Small>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
