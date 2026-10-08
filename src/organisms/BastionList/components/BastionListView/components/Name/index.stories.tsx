import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Name } from '~/organisms/BastionList/components/BastionListView/components/Name';

const meta = {
  title: 'Organisms/BastionList/BastionListView/Name',
  component: Name,
  args: {
    children: 'Name',
  },
} satisfies Meta<typeof Name>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
