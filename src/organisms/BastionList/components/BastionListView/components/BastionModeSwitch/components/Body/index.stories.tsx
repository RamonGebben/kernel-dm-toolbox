import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Body } from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch/components/Body';

const meta = {
  title: 'Organisms/BastionList/BastionListView/BastionModeSwitch/Body',
  component: Body,
  args: {
    children: 'Body',
  },
} satisfies Meta<typeof Body>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
