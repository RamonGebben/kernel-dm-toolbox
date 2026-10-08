import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stepper } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Stepper';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/Stepper',
  component: Stepper,
  args: {
    children: <li>Item</li>,
  },
} satisfies Meta<typeof Stepper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
