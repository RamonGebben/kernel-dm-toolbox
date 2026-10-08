import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Row } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/EventResolver/components/Row';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/EventResolver/Row',
  component: Row,
  args: {
    children: 'Row',
  },
} satisfies Meta<typeof Row>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
