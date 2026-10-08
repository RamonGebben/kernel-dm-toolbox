import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Message } from '~/organisms/ConnectionStatus/components/ConnectionStatusView/components/Message';

const meta = {
  title: 'Organisms/ConnectionStatus/ConnectionStatusView/Message',
  component: Message,
  args: {
    children: 'Message',
  },
} satisfies Meta<typeof Message>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
