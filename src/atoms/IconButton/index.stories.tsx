import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { IconButton } from '~/atoms/IconButton';

const meta = {
  title: 'Atoms/IconButton',
  component: IconButton,
  args: {
    $isActive: false,
    children: '+',
  },
} satisfies Meta<typeof IconButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
