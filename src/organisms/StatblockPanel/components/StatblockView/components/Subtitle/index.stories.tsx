import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Subtitle } from '~/organisms/StatblockPanel/components/StatblockView/components/Subtitle';

const meta = {
  title: 'Organisms/StatblockPanel/StatblockView/Subtitle',
  component: Subtitle,
  args: {
    children: 'Subtitle',
  },
} satisfies Meta<typeof Subtitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
