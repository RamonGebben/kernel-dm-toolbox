import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Centered } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Centered';

const meta = {
  title: 'Organisms/PlayerBoard/PlayerBoardView/Centered',
  component: Centered,
  args: {
    children: 'Centered',
  },
} satisfies Meta<typeof Centered>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
