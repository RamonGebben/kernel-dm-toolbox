import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Frame } from '~/atoms/Panel/components/Frame';

const meta = {
  title: 'Atoms/Panel/Frame',
  component: Frame,
  args: {
    children: 'Frame',
  },
} satisfies Meta<typeof Frame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
