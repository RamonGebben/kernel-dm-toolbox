import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ScenarioListView } from '~/organisms/ScenarioList/components/ScenarioListView';

const scenarios = [
  {
    id: 'scenario-1',
    name: 'Bridge ambush',
    note: null,
    trialCount: 100,
    partyCount: 4,
    monsterCount: 6,
  },
  {
    id: 'scenario-2',
    name: 'Dragon showdown',
    note: 'Boss fight, level 12',
    trialCount: 500,
    partyCount: 5,
    monsterCount: 1,
  },
];

const meta = {
  title: 'Organisms/ScenarioList/ScenarioListView',
  component: ScenarioListView,
  args: {
    isPending: false,
    isCreating: false,
    scenarios,
    selectedScenarioId: 'scenario-1',
    onSelect: fn(),
    onCreate: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof ScenarioListView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Loading: Story = {
  args: { isPending: true },
};

export const Empty: Story = {
  args: { scenarios: [] },
};

export const NoneSelected: Story = {
  args: { selectedScenarioId: null },
};
