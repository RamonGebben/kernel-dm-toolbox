import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { PlayerMapBoardView } from '~/organisms/PlayerScreen/components/PlayerScreenView/components/PlayerMapBoardView';

const meta = {
  title: 'Organisms/PlayerScreen/PlayerMapBoardView',
  component: PlayerMapBoardView,
  args: {
    map: null,
    viewport: { x: 0, y: 0, zoom: 1 },
  },
  parameters: { layout: 'fullscreen' },
  decorators: [
    Story => (
      <div style={{ width: 600, height: 400 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlayerMapBoardView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoMapYet: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No map yet')).toBeVisible();
  },
};

export const Loaded: Story = {
  args: {
    map: {
      fileUrl: '/api/maps/example/file',
      kind: 'image',
      nativeWidth: 2000,
      nativeHeight: 1500,
      grid: {
        visible: true,
        color: '#e0e5f5',
        opacity: 0.18,
        cellSize: 50,
        originX: 0,
        originY: 0,
      },
      backgroundColor: '#0c0d11',
      fog: { enabled: false, baseState: 'covered', strokes: [] },
      fogOpacity: 0.9,
      measurementShapes: [],
      measurementLabelScale: 1,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Map canvas')).toBeVisible();
  },
};
