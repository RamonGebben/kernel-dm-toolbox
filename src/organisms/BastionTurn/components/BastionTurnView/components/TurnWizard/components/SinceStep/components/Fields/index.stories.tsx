import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Fields } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/SinceStep/components/Fields';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/SinceStep/Fields',
  component: Fields,
  args: {
    children: 'Fields',
  },
} satisfies Meta<typeof Fields>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
