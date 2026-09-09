import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { PlayerScreenStage } from '~/organisms/PlayerScreen/components/PlayerScreenStage';

const Content = () => (
  <div
    style={{
      width: '100%',
      height: '100%',
      display: 'grid',
      placeItems: 'center',
      background: '#1c2030',
      color: '#f5f5f5',
    }}
  >
    Player screen content
  </div>
);

const meta = {
  title: 'Organisms/PlayerScreen/PlayerScreenStage',
  component: PlayerScreenStage,
  args: {
    physicalSize: { width: 1920, height: 1080 },
    orientation: 'auto',
    children: <Content />,
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof PlayerScreenStage>;

export default meta;

type Story = StoryObj<typeof meta>;

export const LandscapeAuto: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Player screen content')).toBeVisible();
  },
};

export const PortraitPhysicalScreen: Story = {
  args: { physicalSize: { width: 1080, height: 1920 } },
};

export const LandscapeScreenForcedPortrait: Story = {
  args: {
    physicalSize: { width: 1920, height: 1080 },
    orientation: 'portrait',
  },
};

export const PortraitScreenForcedLandscape: Story = {
  args: {
    physicalSize: { width: 1080, height: 1920 },
    orientation: 'landscape',
  },
};
