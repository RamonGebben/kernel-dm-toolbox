import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { List } from '~/molecules/FormattedText/components/List';

const meta = {
  title: 'Molecules/FormattedText/List',
  component: List,
  args: {
    children: <li>Item</li>,
  },
} satisfies Meta<typeof List>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
