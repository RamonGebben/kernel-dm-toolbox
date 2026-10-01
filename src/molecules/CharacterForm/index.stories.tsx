import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CharacterForm } from '~/molecules/CharacterForm';

const meta = {
  title: 'Molecules/CharacterForm',
  component: CharacterForm,
  args: {
    isSaving: false,
    submitLabel: 'Add character',
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof CharacterForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Blank: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Name'), 'Hammie');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Add character' }),
    );

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Hammie', level: 1, armorClass: 10 }),
    );
  },
};

const sigrid = {
  name: 'Sigrid',
  playerName: 'Anna',
  className: 'Paladin',
  subclass: 'Oath of Glory',
  species: 'Goliath',
  armorClass: 20,
  maxHitPoints: 45,
  initiativeModifier: 2,
  level: 5,
  passivePerception: 13,
  passiveInsight: null,
  passiveInvestigation: 10,
  notes: 'Owes the Harpers a favour.',
  isActive: true,
} as const;

export const Editing: Story = {
  args: {
    submitLabel: 'Save changes',
    initialValues: sigrid,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Name')).toHaveValue('Sigrid');
    await expect(canvas.getByLabelText('Max HP')).toHaveValue(45);
    await expect(canvas.getByLabelText('Class')).toHaveValue('Paladin');
    // Not recorded is a blank box, not a 0.
    await expect(canvas.getByLabelText('Passive Insight')).toHaveValue(null);
  },
};

/** Every Party page field, filled in from blank and submitted. */
export const FillingInEverything: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Name'), 'Hammie');
    await userEvent.selectOptions(canvas.getByLabelText('Class'), 'Rogue');
    await userEvent.type(canvas.getByLabelText('Species'), 'Halfling');
    await userEvent.type(canvas.getByLabelText('Passive Perception'), '15');
    await userEvent.type(canvas.getByLabelText('Notes'), 'Afraid of geese.');
    await userEvent.click(canvas.getByLabelText('Active party member'));
    await userEvent.click(
      canvas.getByRole('button', { name: 'Add character' }),
    );

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Hammie',
        className: 'Rogue',
        species: 'Halfling',
        passivePerception: 15,
        passiveInsight: null,
        notes: 'Afraid of geese.',
        isActive: false,
      }),
    );
  },
};

/** Clearing a passive score sends null, not 0. */
export const ClearingAPassiveScore: Story = {
  args: { submitLabel: 'Save changes', initialValues: sigrid },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.clear(canvas.getByLabelText('Passive Perception'));
    await userEvent.click(canvas.getByRole('button', { name: 'Save changes' }));

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ passivePerception: null }),
    );
  },
};

export const Saving: Story = {
  args: { isSaving: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Saving…' }),
    ).toBeDisabled();
  },
};

export const Cancelling: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }));

    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};
