import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Entry } from '~/organisms/BastionTurn/components/BastionTurnView/components/Entry';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/Entry',
  component: Entry,
  args: {
    children: 'Entry',
  },
} satisfies Meta<typeof Entry>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
