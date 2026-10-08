import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Dice } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/EventResolver/components/Dice';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/EventResolver/Dice',
  component: Dice,
  args: {
    children: 'Dice',
  },
} satisfies Meta<typeof Dice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
