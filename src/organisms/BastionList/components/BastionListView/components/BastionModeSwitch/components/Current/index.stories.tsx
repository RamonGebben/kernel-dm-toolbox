import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Current } from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch/components/Current';

const meta = {
  title: 'Organisms/BastionList/BastionListView/BastionModeSwitch/Current',
  component: Current,
  args: {
    children: 'Current',
  },
} satisfies Meta<typeof Current>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
