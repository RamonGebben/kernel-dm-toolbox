import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { BastionDetailView } from '~/organisms/BastionDetail/components/BastionDetailView';
import { specialFacilityByKey } from '~/content/bastion/specialFacilities';
import type { BastionDetail } from '~/server/trpc/helpers/toBastionDetail';

const facility = (
  key: string,
  id: string,
  holder = { id: 'sigrid', name: 'Sigrid' },
) => {
  const definition = specialFacilityByKey[key]!;

  return {
    id,
    facilityKey: key,
    name: definition.name,
    level: definition.level,
    order: definition.order,
    space: definition.space,
    variant: null,
    variantOptions: definition.variant ?? null,
    hirelings: definition.hirelings,
    benefits: definition.benefits,
    orderOptions: definition.orderOptions,
    enlarge: definition.enlarge
      ? {
          costGp: definition.enlarge.costGp,
          summary: definition.enlarge.summary,
        }
      : null,
    isBeingEnlarged: false,
    holder,
    job: null,
    isOutOfAction: false,
    isDuplicate: false,
  };
};

const highwatch: BastionDetail = {
  id: 'highwatch',
  name: 'Highwatch',
  notes: 'On the cliffs above Saltmarsh.',
  defenderCount: 6,
  wallSquares: 0,
  isFullyEnclosed: false,
  kind: 'character',
  owner: { id: 'sigrid', name: 'Sigrid', level: 9, className: 'Paladin' },
  members: [
    {
      id: 'sigrid',
      name: 'Sigrid',
      level: 9,
      className: 'Paladin',
      allowance: { held: 2, total: 4 },
    },
  ],
  allowance: { held: 2, total: 4 },
  pendingFreeRooms: [],
  defenderCapacity: 12,
  specialFacilities: [facility('barrack', 'f1'), facility('sanctuary', 'f2')],
  basicFacilities: [
    {
      id: 'bed',
      type: 'bedroom',
      label: 'Bedroom',
      space: 'cramped',
      enlarge: { to: 'roomy', costGp: 500, days: 25 },
      isBeingEnlarged: false,
    },
  ],
  projects: [
    {
      id: 'p1',
      kind: 'walls',
      description: 'Build 8 squares of wall',
      costGp: 2000,
      daysRemaining: 80,
    },
  ],
  storage: [],
};

const actions = {
  update: fn(async () => ({}) as never),
  abandon: fn(),
  addSpecialFacility: fn(async () => ({}) as never),
  addFreeRooms: fn(),
  setFacilityVariant: fn(),
  removeSpecialFacility: fn(),
  addBasicFacility: fn(),
  removeBasicFacility: fn(),
  startProject: fn(),
  finishProject: fn(),
  cancelProject: fn(),
  addStorageItem: fn(),
  claimStorageItem: fn(),
  removeStorageItem: fn(),
};

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView',
  component: BastionDetailView,
  args: {
    state: { kind: 'loaded', detail: highwatch },
    treasuryGold: 3000,
    characters: [{ id: 'sigrid', name: 'Sigrid' }],
    isSaving: false,
    error: null,
    actions,
  },
} satisfies Meta<typeof BastionDetailView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('heading', { name: 'Highwatch' }),
    ).toBeVisible();
    await expect(
      canvas.getByText('Sigrid · level 9 Paladin · treasury 3,000 gp'),
    ).toBeVisible();
    await expect(canvas.getByText(/Special facilities · 2 of 4/)).toBeVisible();
    await expect(
      canvas.getByRole('article', { name: 'Barrack' }),
    ).toBeVisible();
    await expect(canvas.getByText('Build 8 squares of wall')).toBeVisible();
  },
};

export const Pending: Story = {
  args: { state: { kind: 'pending' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('status', { name: 'Loading the bastion' }),
    ).toBeVisible();
  },
};

export const NoBastion: Story = {
  args: { state: { kind: 'none' } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No bastion selected')).toBeVisible();
  },
};

export const RefusedByTheRules: Story = {
  args: { error: 'The treasury does not hold enough gold for that.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'does not hold enough gold',
    );
  },
};

/** The picker opens over the page and adds through the action. */
export const AddingAFacility: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Add special facility' }),
    );
    await userEvent.click(screen.getByRole('button', { name: 'Add Library' }));

    await expect(args.actions.addSpecialFacility).toHaveBeenCalledWith({
      facilityKey: 'library',
      ignoreRequirements: false,
      holderCharacterId: 'sigrid',
    });
  },
};

export const EnlargingTheBarrack: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: /Enlarge to Vast/ }),
    );

    await expect(args.actions.startProject).toHaveBeenCalledWith({
      kind: 'enlarge-special',
      facilityId: 'f1',
    });
  },
};

export const RecruitingADefender: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'One more defender' }),
    );

    await expect(args.actions.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'highwatch', defenderCount: 7 }),
    );
  },
};

export const EditingTheBastion: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Edit bastion' }));
    await userEvent.clear(screen.getByLabelText('Name'));
    await userEvent.type(screen.getByLabelText('Name'), 'Highwatch Keep');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await expect(args.actions.update).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'highwatch', name: 'Highwatch Keep' }),
    );
  },
};

export const Abandoning: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Abandon Highwatch' }),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Abandon Highwatch' }),
    );

    await expect(args.actions.abandon).toHaveBeenCalledOnce();
  },
};

const theHall: BastionDetail = {
  ...highwatch,
  id: 'hall',
  name: 'The Hall',
  notes: null,
  kind: 'party',
  owner: null,
  members: [
    {
      id: 'sigrid',
      name: 'Sigrid',
      level: 9,
      className: 'Paladin',
      allowance: { held: 1, total: 4 },
    },
    {
      id: 'wren',
      name: 'Wren',
      level: 5,
      className: 'Wizard',
      allowance: { held: 1, total: 2 },
    },
  ],
  allowance: { held: 2, total: 6 },
  specialFacilities: [
    facility('barrack', 'f1'),
    facility('arcane-study', 'f2', { id: 'wren', name: 'Wren' }),
  ],
  pendingFreeRooms: [{ id: 'bo', name: 'Bo' }],
};

/** One bastion for the whole party: each member's facilities and allowance. */
export const PartyBastion: Story = {
  args: { state: { kind: 'loaded', detail: theHall } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(/Shared by the party · 2 members/),
    ).toBeVisible();
    const allowances = canvas.getByRole('list', {
      name: 'Facilities per member',
    });
    await expect(within(allowances).getByText(/Sigrid 1\/\s*4/)).toBeVisible();
    await expect(within(allowances).getByText(/Wren 1\/\s*2/)).toBeVisible();
    await expect(canvas.getByText('Held by Wren')).toBeVisible();
    await expect(canvas.getByText(/Bo has reached level 5/)).toBeVisible();
  },
};

export const AddingForAPartyMember: Story = {
  args: { state: { kind: 'loaded', detail: theHall } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Add special facility' }),
    );
    await userEvent.selectOptions(screen.getByLabelText('For'), 'wren');
    await userEvent.click(screen.getByRole('button', { name: 'Add Library' }));

    await expect(args.actions.addSpecialFacility).toHaveBeenCalledWith({
      facilityKey: 'library',
      ignoreRequirements: false,
      holderCharacterId: 'wren',
    });
  },
};
