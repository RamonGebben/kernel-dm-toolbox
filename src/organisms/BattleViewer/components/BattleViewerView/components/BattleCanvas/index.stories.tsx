import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BattleCanvas } from '~/organisms/BattleViewer/components/BattleViewerView/components/BattleCanvas';
import type { BattleSnapshotCombatant } from '~/utils/deriveBattleSnapshot';

const combatants: BattleSnapshotCombatant[] = [
  {
    id: 'a1',
    name: 'Ari',
    side: 'party',
    position: { x: 2, y: 4 },
    maxHitPoints: 24,
    currentHitPoints: 24,
    isDefeated: false,
  },
  {
    id: 'a2',
    name: 'Bo',
    side: 'party',
    position: { x: 2, y: 5 },
    maxHitPoints: 18,
    currentHitPoints: 4,
    isDefeated: false,
  },
  {
    id: 'm1',
    name: 'Goblin #1',
    side: 'monsters',
    position: { x: 9, y: 4 },
    maxHitPoints: 7,
    currentHitPoints: 7,
    isDefeated: false,
  },
  {
    id: 'm2',
    name: 'Goblin #2',
    side: 'monsters',
    position: { x: 9, y: 5 },
    maxHitPoints: 7,
    currentHitPoints: 0,
    isDefeated: true,
  },
];

const meta = {
  title: 'Organisms/BattleViewer/BattleCanvas',
  component: BattleCanvas,
  args: {
    combatants,
    highlightedCombatantIds: [],
  },
} satisfies Meta<typeof BattleCanvas>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithHighlight: Story = {
  args: { highlightedCombatantIds: ['a1', 'm2'] },
};

export const Empty: Story = {
  args: { combatants: [] },
};
