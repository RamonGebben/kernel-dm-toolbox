import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { InlineRow } from '~/atoms/InlineRow';

const meta = {
  title: 'Atoms/InlineRow',
  component: InlineRow,
  args: {
    children: (
      <>
        <span>First</span>
        <span>Second</span>
      </>
    ),
  },
} satisfies Meta<typeof InlineRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
