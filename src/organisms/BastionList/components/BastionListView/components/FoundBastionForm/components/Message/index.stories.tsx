import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Message } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm/components/Message';

const meta = {
  title: 'Organisms/BastionList/BastionListView/FoundBastionForm/Message',
  component: Message,
  args: {
    children: 'Message',
  },
} satisfies Meta<typeof Message>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
