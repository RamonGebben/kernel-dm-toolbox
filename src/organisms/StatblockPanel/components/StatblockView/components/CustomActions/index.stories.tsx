import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CustomActions } from '~/organisms/StatblockPanel/components/StatblockView/components/CustomActions';

const meta = {
  title: 'Organisms/StatblockPanel/StatblockView/CustomActions',
  component: CustomActions,
  args: {
    children: 'Custom Actions',
  },
} satisfies Meta<typeof CustomActions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
