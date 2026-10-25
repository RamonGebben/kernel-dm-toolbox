import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Result } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/EventResolver/components/Result';

const meta = {
  title:
    'Organisms/BastionTurn/BastionTurnView/TurnWizard/EventResolver/Result',
  component: Result,
  args: {
    children: 'Result',
  },
} satisfies Meta<typeof Result>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
