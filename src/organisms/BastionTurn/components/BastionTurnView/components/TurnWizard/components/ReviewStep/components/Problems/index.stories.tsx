import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Problems } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep/components/Problems';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/ReviewStep/Problems',
  component: Problems,
  args: {
    children: 'Problems',
  },
} satisfies Meta<typeof Problems>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
