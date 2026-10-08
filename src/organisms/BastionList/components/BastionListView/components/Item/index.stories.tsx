import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Item } from '~/organisms/BastionList/components/BastionListView/components/Item';

const meta = {
  title: 'Organisms/BastionList/BastionListView/Item',
  component: Item,
  args: {
    $isSelected: false,
    children: 'Item',
  },
} satisfies Meta<typeof Item>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
