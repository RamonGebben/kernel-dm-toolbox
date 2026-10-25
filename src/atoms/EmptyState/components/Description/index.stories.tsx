import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Description } from '~/atoms/EmptyState/components/Description';

const meta = {
  title: 'Atoms/EmptyState/Description',
  component: Description,
  args: {
    children: 'Description',
  },
} satisfies Meta<typeof Description>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
