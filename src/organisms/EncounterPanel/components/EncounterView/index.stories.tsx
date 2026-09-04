import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { EncounterView } from '~/organisms/EncounterPanel/components/EncounterView';

/** The exact order from the reference screenshot. */
const combatants = [
  {
    id: 'meat',
    displayName: 'Meat',
    initiative: 19,
    currentHitPoints: 35,
    maxHitPoints: 52,
    temporaryHitPoints: 0,
    armorClass: 18,
    isHidden: false,
    isDelayed: false,
    conditions: [],
    isPlayerCharacter: false,
    initiativeBonus: 2,
  },
  {
    id: 'dragon',
    displayName: 'Young Black Dragon',
    initiative: 17,
    currentHitPoints: 0,
    maxHitPoints: 127,
    temporaryHitPoints: 0,
    armorClass: 18,
    isHidden: false,
    isDelayed: false,
    conditions: [],
    isPlayerCharacter: false,
    initiativeBonus: 2,
  },
  {
    id: 'sigrid',
    displayName: 'Sigrid',
    initiative: 10,
    currentHitPoints: 45,
    maxHitPoints: 45,
    temporaryHitPoints: 0,
    armorClass: 20,
    isHidden: false,
    isDelayed: false,
    conditions: [],
    isPlayerCharacter: true,
    initiativeBonus: null,
  },
  {
    id: 'hammie',
    displayName: 'Hammie',
    initiative: 5,
    currentHitPoints: 37,
    maxHitPoints: 37,
    temporaryHitPoints: 0,
    armorClass: 19,
    isHidden: false,
    isDelayed: false,
    conditions: [],
    isPlayerCharacter: true,
    initiativeBonus: null,
  },
];

const meta = {
  title: 'Organisms/EncounterPanel/EncounterView',
  component: EncounterView,
  args: {
    isPending: false,
    roundNumber: 0,
    difficulty: {
      difficulty: 'moderate' as const,
      totalExperience: 2900,
      hasParty: true,
    },
    combatants,
    selectedCombatantId: 'dragon',
    activeCombatantId: null,
    isRollingInitiative: false,
    isStarting: false,
    onSelect: fn(),
    onRemove: fn(),
    onToggleDelay: fn(),
    onOpenInitiativeRoll: fn(),
    onCloseInitiativeRoll: fn(),
    onStart: fn(),
    onEndCombat: fn(),
    onNextTurn: fn(),
    onPreviousTurn: fn(),
    onClearMonsters: fn(),
  },
} satisfies Meta<typeof EncounterView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('35/52')).toBeVisible();
    await expect(canvas.getByText('0/127')).toBeVisible();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Select Sigrid' }),
    );
    await expect(args.onSelect).toHaveBeenCalledWith('sigrid');
  },
};

export const InRoundThree: Story = {
  args: { roundNumber: 3, activeCombatantId: 'dragon' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Round 3')).toBeVisible();
    await expect(canvas.getByText('turn')).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Next turn' }));
    await expect(args.onNextTurn).toHaveBeenCalledOnce();
  },
};

/** Before the fight starts the only turn action is rolling initiative. */
export const NotStarted: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Roll for initiative' }),
    );
    await expect(args.onOpenInitiativeRoll).toHaveBeenCalledOnce();

    // Back and End combat mean nothing before initiative is rolled.
    await expect(
      canvas.queryByRole('button', { name: 'Back' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByRole('button', { name: 'End combat' }),
    ).not.toBeInTheDocument();
  },
};

/** The dialog is where the party's physical rolls get typed in. */
export const RollingForInitiative: Story = {
  args: { isRollingInitiative: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    // Scoped to the dialog: the order behind it labels its rows by name too.
    const dialog = within(
      canvas.getByRole('dialog', { name: 'Roll for initiative' }),
    );

    // Monsters are prefilled with the roll the tool already made for them.
    await expect(dialog.getByLabelText(/Young Black Dragon/)).toHaveValue(17);
    await expect(dialog.getByLabelText(/Sigrid/)).toHaveValue(null);

    await userEvent.type(dialog.getByLabelText(/Sigrid/), '14');
    await userEvent.click(dialog.getByRole('button', { name: 'Start combat' }));

    await expect(args.onStart).toHaveBeenCalledWith([
      { id: 'meat', initiative: 19 },
      { id: 'dragon', initiative: 17 },
      { id: 'sigrid', initiative: 14 },
      { id: 'hammie', initiative: 5 },
    ]);
  },
};

/** A fight has to be endable, not only clearable. */
export const EndingCombat: Story = {
  args: { roundNumber: 4, activeCombatantId: 'meat' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'End combat' }));

    await expect(args.onEndCombat).toHaveBeenCalledOnce();
  },
};

export const WithADelayedCombatant: Story = {
  args: {
    roundNumber: 2,
    activeCombatantId: 'meat',
    combatants: combatants.map(combatant =>
      combatant.id === 'sigrid' ? { ...combatant, isDelayed: true } : combatant,
    ),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('delayed')).toBeVisible();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Return Sigrid to the order' }),
    );
    await expect(args.onToggleDelay).toHaveBeenCalledWith('sigrid');
  },
};

/** The reference tool's readout: a CR 7 dragon against four level fives. */
export const ShowsEncounterDifficulty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Moderate')).toBeVisible();
    await expect(canvas.getByText('2,900 XP')).toBeVisible();
  },
};

export const Pending: Story = {
  args: { isPending: true, combatants: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Loading the encounter')).toBeVisible();
  },
};

export const Empty: Story = {
  args: { combatants: [], selectedCombatantId: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No combatants yet')).toBeVisible();
    // Nobody to roll for, so the fight cannot be started.
    await expect(
      canvas.getByRole('button', { name: 'Roll for initiative' }),
    ).toBeDisabled();
    // Nothing to clear, so the action is unavailable rather than a no-op.
    await expect(
      canvas.getByRole('button', { name: 'Clear monsters' }),
    ).toBeDisabled();
  },
};

/** Only the party is left, so there are no monsters to clear. */
export const PartyOnly: Story = {
  args: {
    combatants: combatants.filter(combatant => combatant.isPlayerCharacter),
    selectedCombatantId: null,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Clear monsters' }),
    ).toBeDisabled();
  },
};

export const ClearingMonsters: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Clear monsters' }),
    );

    await expect(args.onClearMonsters).toHaveBeenCalledOnce();
  },
};
