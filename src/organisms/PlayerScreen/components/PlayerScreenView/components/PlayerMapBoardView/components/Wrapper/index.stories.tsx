import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Wrapper } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/PlayerMapBoardView/components/Wrapper';

const meta = {
  title: 'Organisms/PlayerScreen/PlayerScreenView/PlayerMapBoardView/Wrapper',
  component: Wrapper,
  args: {
    children: 'Wrapper',
  },
} satisfies Meta<typeof Wrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
