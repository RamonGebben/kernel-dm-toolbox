import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stack } from '~/atoms/Stack';

const meta = {
  title: 'Atoms/Stack',
  component: Stack,
  args: {
    children: (
      <>
        <span>First</span>
        <span>Second</span>
      </>
    ),
  },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Tight: Story = { args: { $gap: 'xs' } };
