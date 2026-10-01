import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { PartyRosterView } from '~/organisms/PartyRoster/components/PartyRosterView';
import type { PartyCharacter } from '~/organisms/PartyRoster/hooks/usePartyRoster';

const sigrid: PartyCharacter = {
  id: 'sigrid',
  name: 'Sigrid',
  playerName: 'Anna',
  level: 5,
  className: 'Paladin',
  subclass: 'Oath of Glory',
  species: 'Goliath',
  armorClass: 20,
  maxHitPoints: 45,
  initiativeModifier: 2,
  passivePerception: 13,
  passiveInsight: 11,
  passiveInvestigation: 10,
  notes: null,
  isActive: true,
};

const hammie: PartyCharacter = {
  ...sigrid,
  id: 'hammie',
  name: 'Hammie',
  playerName: 'Bo',
  className: 'Rogue',
  subclass: null,
  species: 'Halfling',
  armorClass: 15,
  maxHitPoints: 33,
};

const retired: PartyCharacter = {
  ...sigrid,
  id: 'retired',
  name: 'Old Brom',
  playerName: null,
  className: 'Fighter',
  isActive: false,
};

const meta = {
  title: 'Organisms/PartyRoster/PartyRosterView',
  component: PartyRosterView,
  args: {
    isPending: false,
    active: [hammie, sigrid],
    benched: [retired],
    editor: { kind: 'closed' },
    isSaving: false,
    isRemoving: false,
    updatingId: null,
    onStartCreate: fn(),
    onStartEdit: fn(),
    onCloseEditor: fn(),
    onSubmit: fn(),
    onToggleActive: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof PartyRosterView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const active = canvas.getByRole('list', { name: 'Active members' });
    await expect(within(active).getAllByRole('listitem')).toHaveLength(2);

    const benched = canvas.getByRole('list', { name: 'Benched members' });
    await expect(within(benched).getByText('Old Brom')).toBeVisible();
  },
};

export const Pending: Story = {
  args: { isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('status', { name: 'Loading the party' }),
    ).toBeVisible();
  },
};

export const Empty: Story = {
  args: { active: [], benched: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No party yet')).toBeVisible();
  },
};

/** Nobody benched: no empty "Benched" heading. */
export const NobodyBenched: Story = {
  args: { benched: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByText('Benched')).not.toBeInTheDocument();
  },
};

export const StartingToAdd: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Add character' }),
    );
    await expect(args.onStartCreate).toHaveBeenCalledOnce();
  },
};

export const StartingToEdit: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Edit Sigrid' }));
    await expect(args.onStartEdit).toHaveBeenCalledWith('sigrid');
  },
};

export const RecallingABenchedMember: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Recall Old Brom' }),
    );
    await expect(args.onToggleActive).toHaveBeenCalledWith(retired);
  },
};

/** What `/party?edit=new` renders. */
export const EditorOpenForNew: Story = {
  args: { editor: { kind: 'new' } },
  play: async () => {
    await expect(
      screen.getByRole('dialog', { name: 'New character' }),
    ).toBeVisible();
    await expect(screen.getByLabelText('Name')).toHaveValue('');
  },
};

/** What `/party?edit=sigrid` renders — the tracker's Edit link lands here. */
export const EditorOpenForACharacter: Story = {
  args: { editor: { kind: 'edit', character: sigrid } },
  play: async ({ args }) => {
    await expect(
      screen.getByRole('dialog', { name: 'Edit Sigrid' }),
    ).toBeVisible();
    await expect(screen.getByLabelText('Class')).toHaveValue('Paladin');

    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Sigrid', className: 'Paladin' }),
    );
  },
};

/** An id the roster has not resolved yet keeps the dialog shut. */
export const EditorPending: Story = {
  args: { editor: { kind: 'pending' } },
  play: async () => {
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
};
