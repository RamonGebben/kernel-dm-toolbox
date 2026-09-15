import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { PlacementGrid } from '~/organisms/ScenarioBuilder/components/ScenarioBuilderView/components/PlacementGrid';

const tokens = [
  { key: 'pc-1', label: 'Ari', color: '#6fa7ff', position: { x: 2, y: 4 } },
  { key: 'pc-2', label: 'Bo', color: '#6fa7ff', position: { x: 2, y: 5 } },
  {
    key: 'monster-1',
    label: 'Gob',
    color: '#ff6f6f',
    position: { x: 9, y: 4 },
  },
  { key: 'monster-2', label: 'Gob', color: '#ff6f6f', position: null },
];

const meta = {
  title: 'Organisms/ScenarioBuilder/PlacementGrid',
  component: PlacementGrid,
  args: {
    tokens,
    armedKey: null,
    onPlaceCell: fn(),
  },
} satisfies Meta<typeof PlacementGrid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TokenArmed: Story = {
  args: { armedKey: 'monster-2' },
};

export const Empty: Story = {
  args: { tokens: [] },
};
