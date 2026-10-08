import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Reconnecting } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/Reconnecting';

const meta = {
  title: 'Organisms/PlayerScreen/PlayerScreenView/Reconnecting',
  component: Reconnecting,
  args: {
    children: 'Reconnecting',
  },
} satisfies Meta<typeof Reconnecting>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
