import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NameRow } from '~/organisms/StatblockPanel/components/StatblockView/components/NameRow';

const meta = {
  title: 'Organisms/StatblockPanel/StatblockView/NameRow',
  component: NameRow,
  args: {
    children: 'Name Row',
  },
} satisfies Meta<typeof NameRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
