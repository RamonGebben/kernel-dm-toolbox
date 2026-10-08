import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CharacterRosterView } from '~/organisms/CharacterRoster/components/CharacterRosterView';

const sigrid = {
  id: 'sigrid',
  name: 'Sigrid',
  playerName: 'Anna',
  level: 5,
  className: 'Paladin',
  subclass: null,
  species: 'Goliath',
  armorClass: 20,
  maxHitPoints: 45,
  initiativeModifier: 2,
};

const hammie = {
  ...sigrid,
  id: 'hammie',
  name: 'Hammie',
  playerName: 'Bo',
  className: 'Rogue',
  species: 'Halfling',
  armorClass: 15,
  maxHitPoints: 33,
  initiativeModifier: 4,
};

const meta = {
  title: 'Organisms/CharacterRoster/CharacterRosterView',
  component: CharacterRosterView,
  args: {
    isPending: false,
    characters: [hammie, sigrid],
    combatantCharacterIds: [],
    canAddAll: true,
    isAddingAll: false,
    onAddToEncounter: fn(),
    onAddAllActive: fn(),
  },
} satisfies Meta<typeof CharacterRosterView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getAllByRole('listitem')).toHaveLength(2);
    // Pick-only: nothing here creates or removes a character.
    await expect(
      canvas.queryByRole('button', { name: 'Add character' }),
    ).not.toBeInTheDocument();
    await expect(
      canvas.getByRole('link', { name: 'Manage the party →' }),
    ).toHaveAttribute('href', '/party');
  },
};

export const Pending: Story = {
  args: { isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('status', { name: 'Loading characters' }),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Add all active' }),
    ).toBeDisabled();
  },
};

export const Empty: Story = {
  args: { characters: [], canAddAll: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No active party members')).toBeVisible();
    await expect(
      canvas.getByRole('link', { name: 'Go to the Party page' }),
    ).toHaveAttribute('href', '/party');
  },
};

export const AddingOne: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Add Sigrid to the encounter' }),
    );

    await expect(args.onAddToEncounter).toHaveBeenCalledWith(sigrid);
  },
};

export const AddingAllActive: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Add all active' }),
    );

    await expect(args.onAddAllActive).toHaveBeenCalledOnce();
  },
};

/** Someone is sick tonight: the rest went in one by one, Hammie stays out. */
export const PartlyInEncounter: Story = {
  args: { combatantCharacterIds: ['sigrid'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Add Sigrid to the encounter' }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole('button', { name: 'Add Hammie to the encounter' }),
    ).toBeEnabled();
  },
};

export const EveryoneInTheFight: Story = {
  args: { combatantCharacterIds: ['sigrid', 'hammie'], canAddAll: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Add all active' }),
    ).toBeDisabled();
  },
};

export const AddingAllInFlight: Story = {
  args: { isAddingAll: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Adding…' }),
    ).toBeDisabled();
  },
};
