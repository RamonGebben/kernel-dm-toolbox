import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SkeletonLine } from '~/organisms/ConnectionStatus/components/ConnectionStatusView/components/SkeletonLine';

const meta = {
  title: 'Organisms/ConnectionStatus/ConnectionStatusView/SkeletonLine',
  component: SkeletonLine,
  args: {
    $isShort: false,
    children: 'Skeleton Line',
  },
} satisfies Meta<typeof SkeletonLine>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
