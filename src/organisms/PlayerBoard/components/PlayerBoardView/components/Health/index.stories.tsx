import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Health } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Health';

const meta = {
  title: 'Organisms/PlayerBoard/PlayerBoardView/Health',
  component: Health,
  args: {
    $status: 'healthy',
    children: 'Health',
  },
} satisfies Meta<typeof Health>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
