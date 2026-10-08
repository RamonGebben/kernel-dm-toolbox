import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Name } from '~/molecules/CreatureListItem/components/Name';

const meta = {
  title: 'Molecules/CreatureListItem/Name',
  component: Name,
  args: {
    children: 'Name',
  },
} satisfies Meta<typeof Name>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
