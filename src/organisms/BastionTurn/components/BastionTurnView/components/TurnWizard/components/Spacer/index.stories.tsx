import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Spacer } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Spacer';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/Spacer',
  component: Spacer,
  args: {
    children: 'Spacer',
  },
} satisfies Meta<typeof Spacer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
