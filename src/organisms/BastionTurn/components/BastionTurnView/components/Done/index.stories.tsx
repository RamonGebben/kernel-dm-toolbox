import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Done } from '~/organisms/BastionTurn/components/BastionTurnView/components/Done';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/Done',
  component: Done,
  args: {
    children: 'Done',
  },
} satisfies Meta<typeof Done>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
