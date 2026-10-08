import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stage } from '~/organisms/PlayerScreen/components/PlayerScreenStage/components/Stage';

const meta = {
  title: 'Organisms/PlayerScreen/PlayerScreenStage/Stage',
  component: Stage,
  args: {
    children: 'Stage',
  },
} satisfies Meta<typeof Stage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
