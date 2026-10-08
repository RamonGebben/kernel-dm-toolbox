import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Round } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Round';

const meta = {
  title: 'Organisms/PlayerBoard/PlayerBoardView/Round',
  component: Round,
  args: {
    children: 'Round',
  },
} satisfies Meta<typeof Round>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
