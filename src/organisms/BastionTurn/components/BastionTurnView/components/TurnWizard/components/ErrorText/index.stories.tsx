import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ErrorText } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/ErrorText';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/ErrorText',
  component: ErrorText,
  args: {
    children: 'Error Text',
  },
} satisfies Meta<typeof ErrorText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
