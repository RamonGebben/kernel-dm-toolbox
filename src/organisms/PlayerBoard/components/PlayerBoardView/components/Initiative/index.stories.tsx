import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Initiative } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Initiative';

const meta = {
  title: 'Organisms/PlayerBoard/PlayerBoardView/Initiative',
  component: Initiative,
  args: {
    children: 'Initiative',
  },
} satisfies Meta<typeof Initiative>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
