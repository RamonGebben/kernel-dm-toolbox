import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Name } from '~/molecules/MapRow/components/Name';

const meta = {
  title: 'Molecules/MapRow/Name',
  component: Name,
  args: {
    children: 'Name',
  },
} satisfies Meta<typeof Name>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
