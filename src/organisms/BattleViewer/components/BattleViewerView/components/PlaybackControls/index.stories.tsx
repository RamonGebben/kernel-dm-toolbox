import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { PlaybackControls } from '~/organisms/BattleViewer/components/BattleViewerView/components/PlaybackControls';

const meta = {
  title: 'Organisms/BattleViewer/PlaybackControls',
  component: PlaybackControls,
  args: {
    isPlaying: false,
    isFinished: false,
    speed: 1,
    revealedCount: 4,
    totalEntries: 20,
    onPlay: fn(),
    onPause: fn(),
    onStep: fn(),
    onSpeedChange: fn(),
  },
} satisfies Meta<typeof PlaybackControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Paused: Story = {};

export const Playing: Story = {
  args: { isPlaying: true },
};

export const Finished: Story = {
  args: { isFinished: true, revealedCount: 20 },
};
