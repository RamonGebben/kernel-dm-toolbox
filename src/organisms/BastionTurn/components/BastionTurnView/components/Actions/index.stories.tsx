import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Actions } from '~/organisms/BastionTurn/components/BastionTurnView/components/Actions';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/Actions',
  component: Actions,
  args: {
    children: 'Actions',
  },
} satisfies Meta<typeof Actions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
