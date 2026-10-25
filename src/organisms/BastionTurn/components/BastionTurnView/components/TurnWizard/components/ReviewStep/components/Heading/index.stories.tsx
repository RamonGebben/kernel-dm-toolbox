import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heading } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ReviewStep/components/Heading';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/ReviewStep/Heading',
  component: Heading,
  args: {
    children: 'Heading',
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
