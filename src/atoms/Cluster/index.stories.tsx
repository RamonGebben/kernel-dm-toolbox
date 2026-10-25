import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Cluster } from '~/atoms/Cluster';

const meta = {
  title: 'Atoms/Cluster',
  component: Cluster,
  args: {
    children: (
      <>
        <span>First</span>
        <span>Second</span>
      </>
    ),
  },
} satisfies Meta<typeof Cluster>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tight: Story = { args: { $gap: 'xs' } };
