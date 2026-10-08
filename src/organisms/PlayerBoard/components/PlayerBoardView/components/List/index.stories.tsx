import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { List } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/List';

const meta = {
  title: 'Organisms/PlayerBoard/PlayerBoardView/List',
  component: List,
  args: {
    children: <li>Item</li>,
  },
} satisfies Meta<typeof List>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
