import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SpreadRow } from '~/atoms/SpreadRow';

const meta = {
  title: 'Atoms/SpreadRow',
  component: SpreadRow,
  args: {
    children: (
      <>
        <span>Start</span>
        <span>End</span>
      </>
    ),
  },
} satisfies Meta<typeof SpreadRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TopAligned: Story = { args: { $align: 'flex-start' } };
