import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { FacilityPicker } from '~/organisms/BastionDetail/components/BastionDetailView/components/FacilityPicker';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/FacilityPicker',
  component: FacilityPicker,
  args: {
    members: [
      {
        id: 'sigrid',
        name: 'Sigrid',
        level: 9,
        className: 'Paladin',
        heldKeys: ['barrack'],
      },
    ],
    bastionKeys: ['barrack'],
    isSaving: false,
    onAdd: fn(),
  },
} satisfies Meta<typeof FacilityPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AddingAnEligibleFacility: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Add Library' }));

    await expect(args.onAdd).toHaveBeenCalledWith('library', false, 'sigrid');
  },
};

/** Too high, wrong class, or already held — each says why and stays shut. */
export const ExplainsWhatIsNotAllowed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Add Archive' }),
    ).toBeDisabled();
    await expect(
      canvas.getAllByText('Needs character level 13').length,
    ).toBeGreaterThan(0);
    await expect(
      canvas.getByRole('button', { name: 'Add Arcane Study' }),
    ).toBeDisabled();
    // A second Barrack is allowed.
    await expect(
      canvas.getByRole('button', { name: 'Add Barrack' }),
    ).toBeEnabled();
  },
};

export const DmOverride: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByLabelText('Ignore the rules (DM override)'),
    );
    await userEvent.click(canvas.getByRole('button', { name: 'Add Archive' }));

    await expect(args.onAdd).toHaveBeenCalledWith('archive', true, 'sigrid');
  },
};

export const AllowanceFull: Story = {
  args: {
    members: [
      {
        id: 'hammie',
        name: 'Hammie',
        level: 5,
        className: 'Rogue',
        heldKeys: ['barrack', 'garden'],
      },
    ],
    bastionKeys: ['barrack', 'garden'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Add Library' }),
    ).toBeDisabled();
    await expect(
      canvas.getAllByText('All 2 facilities for this level are taken').length,
    ).toBeGreaterThan(0);
  },
};

/** A party bastion: pick the member first, and their own rules apply. */
export const ForAPartyMember: Story = {
  args: {
    members: [
      {
        id: 'sigrid',
        name: 'Sigrid',
        level: 9,
        className: 'Paladin',
        heldKeys: [],
      },
      { id: 'wren', name: 'Wren', level: 5, className: 'Wizard', heldKeys: [] },
    ],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    // Sigrid is a Paladin: no Arcane Study for her.
    await expect(
      canvas.getByRole('button', { name: 'Add Arcane Study' }),
    ).toBeDisabled();

    await userEvent.selectOptions(canvas.getByLabelText('For'), 'wren');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Add Arcane Study' }),
    );

    await expect(args.onAdd).toHaveBeenCalledWith(
      'arcane-study',
      false,
      'wren',
    );
  },
};

/** Opens on the first member with a free slot, not on one below level 5. */
export const StartsOnSomeoneWithRoom: Story = {
  args: {
    members: [
      { id: 'bo', name: 'Bo', level: 4, className: 'Rogue', heldKeys: [] },
      {
        id: 'sigrid',
        name: 'Sigrid',
        level: 9,
        className: 'Paladin',
        heldKeys: [],
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('For')).toHaveValue('sigrid');
  },
};

/** One Library for the whole bastion: once Sigrid has it, Wren cannot add another. */
export const AlreadyInTheBastion: Story = {
  args: {
    members: [
      { id: 'wren', name: 'Wren', level: 5, className: 'Wizard', heldKeys: [] },
    ],
    bastionKeys: ['library', 'barrack'],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Add Library' }),
    ).toBeDisabled();
    await expect(
      canvas.getAllByText('Already in this bastion').length,
    ).toBeGreaterThan(0);
    // Barrack is one of the four that may repeat.
    await expect(
      canvas.getByRole('button', { name: 'Add Barrack' }),
    ).toBeEnabled();
  },
};
