import { useRef } from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { PlayerScreenView } from '~/organisms/PlayerScreen/components/PlayerScreenView';

const EXAMPLE_MAP = {
  fileUrl: '/api/maps/example/file',
  kind: 'image' as const,
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
  fog: { enabled: false, baseState: 'covered' as const, strokes: [] },
  fogOpacity: 0.9,
};

/** `mapAreaRef` is owned by the connected boundary in real usage — a story
 * just needs a stable ref to satisfy the prop. */
const Fixture = (
  props: Omit<Parameters<typeof PlayerScreenView>[0], 'mapAreaRef'>,
) => {
  const mapAreaRef = useRef<HTMLDivElement | null>(null);
  return <PlayerScreenView {...props} mapAreaRef={mapAreaRef} />;
};

const meta = {
  title: 'Organisms/PlayerScreen/PlayerScreenView',
  component: Fixture,
  args: {
    mode: 'tracker',
    map: null,
    viewport: { x: 0, y: 0, zoom: 1 },
    isConnected: true,
  },
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof Fixture>;

export default meta;

type Story = StoryObj<typeof meta>;

export const TrackerMode: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No fight in progress')).toBeVisible();
  },
};

export const MapMode: Story = {
  args: { mode: 'map', map: EXAMPLE_MAP },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Map canvas')).toBeVisible();
  },
};

export const MapModeNoMapYet: Story = {
  args: { mode: 'map' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No map yet')).toBeVisible();
  },
};

export const BothModes: Story = {
  args: { mode: 'both', map: EXAMPLE_MAP },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Map canvas')).toBeVisible();
    await expect(canvas.getByText('No fight in progress')).toBeVisible();
  },
};

export const MapModeDisconnected: Story = {
  args: { mode: 'map', map: EXAMPLE_MAP, isConnected: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Reconnecting…')).toBeVisible();
  },
};
