import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { FacilityPicker } from '~/organisms/BastionDetail/components/BastionDetailView/components/FacilityPicker';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/FacilityPicker',
  component: FacilityPicker,
  args: {
    owner: { name: 'Sigrid', level: 9, className: 'Paladin' },
    heldKeys: ['barrack'],
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

    await expect(args.onAdd).toHaveBeenCalledWith('library', false);
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

    await expect(args.onAdd).toHaveBeenCalledWith('archive', true);
  },
};

export const AllowanceFull: Story = {
  args: {
    owner: { name: 'Hammie', level: 5, className: 'Rogue' },
    heldKeys: ['barrack', 'garden'],
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
