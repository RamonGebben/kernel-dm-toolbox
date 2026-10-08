import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Wrapper } from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch/components/Wrapper';

const meta = {
  title: 'Organisms/BastionList/BastionListView/BastionModeSwitch/Wrapper',
  component: Wrapper,
  args: {
    children: 'Wrapper',
  },
} satisfies Meta<typeof Wrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
