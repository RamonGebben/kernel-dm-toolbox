import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ScrollArea } from '~/atoms/ScrollArea';

const meta = {
  title: 'Atoms/ScrollArea',
  component: ScrollArea,
  args: {
    children: 'Scrollable content',
  },
} satisfies Meta<typeof ScrollArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
