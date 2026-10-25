import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Centered } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/PlayerMapBoardView/components/Centered';

const meta = {
  title: 'Organisms/PlayerScreen/PlayerScreenView/PlayerMapBoardView/Centered',
  component: Centered,
  args: {
    children: 'Centered',
  },
} satisfies Meta<typeof Centered>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
