import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Wrapper } from '~/atoms/EmptyState/components/Wrapper';

const meta = {
  title: 'Atoms/EmptyState/Wrapper',
  component: Wrapper,
  args: {
    children: 'Wrapper',
  },
} satisfies Meta<typeof Wrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
