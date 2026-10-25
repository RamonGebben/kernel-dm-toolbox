import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Name } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Name';

const meta = {
  title: 'Organisms/PlayerBoard/PlayerBoardView/Name',
  component: Name,
  args: {
    $isPlayerCharacter: false,
    children: 'Name',
  },
} satisfies Meta<typeof Name>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
