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
    isPlayerCharacter: false,
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
    isPlayerCharacter: false,
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
    isPlayerCharacter: true,
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
    isPlayerCharacter: true,
  },
];

const meta = {
  title: 'Organisms/EncounterPanel/EncounterView',
  component: EncounterView,
  args: {
    isPending: false,
    roundNumber: 0,
    combatants,
    selectedCombatantId: 'dragon',
    activeCombatantId: null,
    onSelect: fn(),
    onRemove: fn(),
    onToggleDelay: fn(),
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

/** Before the fight starts the action reads as starting it, not advancing. */
export const NotStarted: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Start fight' }),
    ).toBeEnabled();
    // There is no previous turn to go back to yet.
    await expect(canvas.getByRole('button', { name: 'Back' })).toBeDisabled();
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
