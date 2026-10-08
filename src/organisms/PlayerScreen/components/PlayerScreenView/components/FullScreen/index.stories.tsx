import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FullScreen } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/FullScreen';

const meta = {
  title: 'Organisms/PlayerScreen/PlayerScreenView/FullScreen',
  component: FullScreen,
  args: {
    children: 'Full Screen',
  },
} satisfies Meta<typeof FullScreen>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
