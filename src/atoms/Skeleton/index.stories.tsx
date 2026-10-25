import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Skeleton } from '~/atoms/Skeleton';

const meta = {
  title: 'Atoms/Skeleton',
  component: Skeleton,
  args: {
    $height: '8rem',
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
