import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Frame } from '~/organisms/PlayerScreen/components/PlayerScreenStage/components/Frame';

const meta = {
  title: 'Organisms/PlayerScreen/PlayerScreenStage/Frame',
  component: Frame,
  args: {
    $rotationDeg: 0,
    $width: 1,
    $height: 1,
    children: 'Frame',
  },
} satisfies Meta<typeof Frame>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
