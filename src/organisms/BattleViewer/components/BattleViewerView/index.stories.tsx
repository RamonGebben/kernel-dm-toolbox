import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { BattleViewerView } from '~/organisms/BattleViewer/components/BattleViewerView';
import type { BattleRunState } from '~/organisms/BattleViewer/hooks/useBattleRunStream';
import type { BattleStartCombatant } from '~/server/simulator/battleStreamTypes';

const combatants: BattleStartCombatant[] = [
  {
    id: 'a1',
    name: 'Ari',
    side: 'party',
    position: { x: 2, y: 4 },
    maxHitPoints: 24,
  },
  {
    id: 'm1',
    name: 'Goblin #1',
    side: 'monsters',
    position: { x: 9, y: 4 },
    maxHitPoints: 7,
  },
  {
    id: 'm2',
    name: 'Goblin #2',
    side: 'monsters',
    position: { x: 9, y: 5 },
    maxHitPoints: 7,
  },
];

const streamingState: BattleRunState = {
  status: 'streaming',
  seed: 123456,
  combatants,
  entries: [
    { kind: 'round-start', round: 1 },
    {
      kind: 'initiative',
      order: [
        { combatantId: 'a1', name: 'Ari', roll: 18 },
        { combatantId: 'm1', name: 'Goblin #1', roll: 12 },
      ],
    },
    {
      kind: 'attack',
      combatantId: 'a1',
      targetId: 'm1',
      actionName: 'Longsword',
      attackRoll: 17,
      targetArmorClass: 13,
      hit: true,
      critical: false,
      damage: 6,
    },
    { kind: 'defeated', combatantId: 'm1', name: 'Goblin #1' },
  ],
  winner: null,
  rounds: null,
};

const completeState: BattleRunState = {
  ...streamingState,
  status: 'complete',
  winner: 'party',
  rounds: 3,
};

const meta = {
  title: 'Organisms/BattleViewer/BattleViewerView',
  component: BattleViewerView,
  args: {
    hasScenario: true,
    canRun: true,
    runState: { status: 'idle' },
    revealedCount: 0,
    isPlaying: false,
    isFinished: false,
    speed: 1,
    onStartRun: fn(),
    onPlay: fn(),
    onPause: fn(),
    onStep: fn(),
    onSpeedChange: fn(),
  },
} satisfies Meta<typeof BattleViewerView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoScenario: Story = {
  args: { hasScenario: false },
};

export const NotReady: Story = {
  args: { canRun: false },
};

export const Idle: Story = {};

export const Connecting: Story = {
  args: { runState: { status: 'connecting' } },
};

export const ErrorState: Story = {
  args: {
    runState: {
      status: 'error',
      message:
        'This scenario needs at least one party member and one monster before it can run.',
    },
  },
};

export const MidFight: Story = {
  args: { runState: streamingState, revealedCount: 3 },
};

export const Finished: Story = {
  args: {
    runState: completeState,
    revealedCount: completeState.entries.length,
    isFinished: true,
  },
};
