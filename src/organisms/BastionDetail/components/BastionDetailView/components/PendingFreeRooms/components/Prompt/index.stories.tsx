import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Prompt } from '~/organisms/BastionDetail/components/BastionDetailView/components/PendingFreeRooms/components/Prompt';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/PendingFreeRooms/Prompt',
  component: Prompt,
  args: {
    children: 'Prompt',
  },
} satisfies Meta<typeof Prompt>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
