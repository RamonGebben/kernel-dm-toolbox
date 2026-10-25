import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PlainList } from '~/atoms/PlainList';

const meta = {
  title: 'Atoms/PlainList',
  component: PlainList,
  args: {
    children: (
      <>
        <li>First</li>
        <li>Second</li>
      </>
    ),
  },
} satisfies Meta<typeof PlainList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
