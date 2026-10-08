import type { Meta as StoryMeta, StoryObj } from '@storybook/nextjs-vite';
import { Meta } from '~/molecules/MapRow/components/Meta';

const meta = {
  title: 'Molecules/MapRow/Meta',
  component: Meta,
  args: {
    children: 'Meta',
  },
} satisfies StoryMeta<typeof Meta>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
