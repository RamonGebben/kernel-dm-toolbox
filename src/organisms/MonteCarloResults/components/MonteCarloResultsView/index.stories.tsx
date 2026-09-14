import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MonteCarloResultsView } from '~/organisms/MonteCarloResults/components/MonteCarloResultsView';
import type { SimulatorScenario } from '~/server/db/schema';

const baseScenario: SimulatorScenario = {
  id: 'scenario-1',
  name: 'Bridge ambush',
  note: null,
  trialCount: 200,
  lastRunAt: null,
  lastRunSummary: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  version: 1,
  updatedBy: 'storybook',
};

const summary: NonNullable<SimulatorScenario['lastRunSummary']> = {
  trialCount: 200,
  baseSeed: 42,
  partyWinRate: 0.78,
  monsterWinRate: 0.15,
  drawRate: 0.07,
  roundsMin: 2,
  roundsMax: 9,
  roundsMean: 4.6,
  roundsMedian: 4,
  roundDistribution: [
    { rounds: 2, trials: 8 },
    { rounds: 3, trials: 34 },
    { rounds: 4, trials: 68 },
    { rounds: 5, trials: 52 },
    { rounds: 6, trials: 26 },
    { rounds: 7, trials: 8 },
    { rounds: 8, trials: 3 },
    { rounds: 9, trials: 1 },
  ],
  combatants: [
    {
      templateKey: 'hero',
      name: 'Ari',
      side: 'party',
      survivalRate: 0.92,
      wentDownRate: 0.15,
      averageDamageDealt: 14.3,
      averageDamageTaken: 9.1,
      killRate: 1.4,
    },
    {
      templateKey: 'goblin-entry',
      name: 'Goblin',
      side: 'monsters',
      survivalRate: 0.18,
      wentDownRate: 0,
      averageDamageDealt: 2.1,
      averageDamageTaken: 6.4,
      killRate: 0.05,
    },
  ],
};

const meta = {
  title: 'Organisms/MonteCarloResults/MonteCarloResultsView',
  component: MonteCarloResultsView,
  args: {
    hasScenario: true,
    isDetailPending: false,
    scenario: baseScenario,
    canRun: true,
    isRunning: false,
    runErrorMessage: null,
    onRunBatch: fn(),
    isSavingPreset: false,
    savePresetErrorMessage: null,
    onSaveAsPreset: fn(async () => {}),
  },
} satisfies Meta<typeof MonteCarloResultsView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NoScenario: Story = {
  args: { hasScenario: false },
};

export const Loading: Story = {
  args: { isDetailPending: true, scenario: null },
};

export const NotReady: Story = {
  args: { canRun: false },
};

export const NoResultsYet: Story = {};

export const Running: Story = {
  args: { isRunning: true },
};

export const WithError: Story = {
  args: {
    runErrorMessage:
      'This scenario needs at least one party member and one monster before it can run.',
  },
};

export const WithResults: Story = {
  args: {
    scenario: {
      ...baseScenario,
      lastRunAt: new Date('2026-02-10T14:30:00Z'),
      lastRunSummary: summary,
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText('Name for the saved encounter preset'),
      'Bridge ambush (balanced)',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Save as preset' }),
    );

    await expect(args.onSaveAsPreset).toHaveBeenCalledWith(
      'Bridge ambush (balanced)',
    );
    await expect(
      canvas.getByText('Saved as “Bridge ambush (balanced)”.'),
    ).toBeVisible();
  },
};

/** Not yet run once — per the issue, saving as a preset is not offered until
 * there is a balance check to base it on. */
export const NoResultsYetHidesSaveAsPreset: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByRole('button', { name: 'Save as preset' }),
    ).not.toBeInTheDocument();
  },
};

export const SaveAsPresetError: Story = {
  args: {
    scenario: {
      ...baseScenario,
      lastRunAt: new Date('2026-02-10T14:30:00Z'),
      lastRunSummary: summary,
    },
    savePresetErrorMessage: 'This scenario has no monsters to save.',
  },
};
