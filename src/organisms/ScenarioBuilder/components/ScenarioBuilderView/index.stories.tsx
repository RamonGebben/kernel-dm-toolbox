import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ScenarioBuilderView } from '~/organisms/ScenarioBuilder/components/ScenarioBuilderView';

const scenario = {
  id: 'scenario-1',
  name: 'Bridge ambush',
  note: 'Three goblins and a hobgoblin holding the far bank.',
  trialCount: 100,
};

const party = [
  {
    id: 'member-1',
    playerCharacterId: 'pc-1',
    name: 'Ari',
    level: 4,
    classLabel: 'Fighter 4',
    position: { x: 2, y: 4 },
  },
  {
    id: 'member-2',
    playerCharacterId: 'pc-2',
    name: 'Bo',
    level: 4,
    classLabel: null,
    position: null,
  },
];

const monsters = [
  {
    id: 'entry-1',
    name: 'Goblin',
    challengeRatingLabel: '1/4',
    count: 3,
    position: { x: 9, y: 4 },
  },
  {
    id: 'entry-2',
    name: 'Hobgoblin',
    challengeRatingLabel: '1/2',
    count: 1,
    position: null,
  },
];

const roster = [
  { id: 'pc-3', name: 'Cass', level: 4, classLabel: 'Wizard 4' },
  { id: 'pc-4', name: 'Dez', level: 4, classLabel: null },
];

const creatureOptions = [
  {
    key: 'library:srd-2024_orc',
    name: 'Orc',
    challengeRatingLabel: '1/2',
    source: 'library' as const,
    creatureSlug: 'srd-2024_orc',
  },
  {
    key: 'custom:homebrew-1',
    name: 'Swamp Lurker',
    challengeRatingLabel: '3',
    source: 'custom' as const,
    customCreatureId: 'homebrew-1',
  },
];

const meta = {
  title: 'Organisms/ScenarioBuilder/ScenarioBuilderView',
  component: ScenarioBuilderView,
  args: {
    scenario,
    isDetailPending: false,
    party,
    monsters,
    roster,
    creatureOptions,
    isCreatureOptionsPending: false,
    monsterSearch: '',
    onMonsterSearchChange: fn(),
    armedTokenKey: null,
    onArmToken: fn(),
    onPlaceCell: fn(),
    onClearPosition: fn(),
    onUpdateScenario: fn(),
    onAddPartyMember: fn(),
    onRemovePartyMember: fn(),
    onAddMonsterEntry: fn(),
    onUpdateMonsterEntryCount: fn(),
    onRemoveMonsterEntry: fn(),
  },
} satisfies Meta<typeof ScenarioBuilderView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoScenarioSelected: Story = {
  args: { scenario: null },
};

export const LoadingDetail: Story = {
  args: { isDetailPending: true },
};

export const EmptyScenario: Story = {
  args: { party: [], monsters: [] },
};

export const NoCharactersOnRoster: Story = {
  args: { party: [], roster: [] },
};

export const TokenArmed: Story = {
  args: { armedTokenKey: 'party:member-2' },
};

export const AddingAPartyMember: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Add Cass' }));

    await expect(args.onAddPartyMember).toHaveBeenCalledWith('pc-3');
  },
};

export const SearchingTheParty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText('Search characters to add'),
      'zzz',
    );

    await expect(canvas.getByText('No matches.')).toBeVisible();
  },
};

export const AddingAMonster: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Add Orc' }));

    await expect(args.onAddMonsterEntry).toHaveBeenCalledWith(
      creatureOptions[0],
    );
  },
};
