import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { List } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep/components/List';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/ReviewStep/List',
  component: List,
  args: {
    children: <li>Item</li>,
  },
} satisfies Meta<typeof List>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
