import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { BastionListView } from '~/organisms/BastionList/components/BastionListView';

const meta = {
  title: 'Organisms/BastionList/BastionListView',
  component: BastionListView,
  args: {
    isPending: false,
    mode: 'per-character',
    canFound: true,
    activeMembers: [{ id: 'sigrid', name: 'Sigrid' }],
    isSwitching: false,
    switchError: null,
    onSwitchMode: fn(async () => undefined),
    bastions: [
      {
        id: 'highwatch',
        name: 'Highwatch',
        kind: 'character',
        ownerName: 'Sigrid',
        ownerLevel: 9,
        memberCount: 1,
        specialFacilityCount: 3,
        allowance: 4,
      },
      {
        id: 'burrow',
        name: 'The Burrow',
        kind: 'character',
        ownerName: 'Hammie',
        ownerLevel: 5,
        memberCount: 1,
        specialFacilityCount: 2,
        allowance: 2,
      },
    ],
    selectedId: 'highwatch',
    foundable: [{ id: 'pip', name: 'Pip', level: 5, canFound: true }],
    isFounding: false,
    foundError: null,
    onSelect: fn(),
    onFound: fn(async () => undefined),
  },
} satisfies Meta<typeof BastionListView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: /Highwatch/ }),
    ).toHaveAttribute('aria-current', 'true');
    await expect(
      canvas.getByText('Hammie · level 5 · 2/2 facilities'),
    ).toBeVisible();
  },
};

export const Selecting: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /The Burrow/ }));

    await expect(args.onSelect).toHaveBeenCalledWith('burrow');
  },
};

export const Pending: Story = {
  args: { isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('status', { name: 'Loading bastions' }),
    ).toBeVisible();
  },
};

export const Empty: Story = {
  args: { bastions: [], selectedId: null },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('No bastions yet')).toBeVisible();
  },
};

/** Founding closes the dialog once it succeeds. */
export const Founding: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Found a bastion' }),
    );
    await userEvent.type(screen.getByLabelText('Name'), 'Pip Hall');
    await userEvent.click(
      screen.getByRole('button', { name: 'Found bastion' }),
    );

    await expect(args.onFound).toHaveBeenCalledWith(
      expect.objectContaining({ ownerCharacterId: 'pip', name: 'Pip Hall' }),
    );
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

/** The party's one shared bastion: no second one to found. */
export const PartyBastion: Story = {
  args: {
    mode: 'party',
    canFound: false,
    bastions: [
      {
        id: 'hall',
        name: 'The Hall',
        kind: 'party',
        ownerName: null,
        ownerLevel: null,
        memberCount: 3,
        specialFacilityCount: 5,
        allowance: 10,
      },
    ],
    selectedId: 'hall',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('The party · 3 members · 5/10 facilities'),
    ).toBeVisible();
    await expect(canvas.getByText('One for the whole party')).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: /Found/ }),
    ).not.toBeInTheDocument();
  },
};
