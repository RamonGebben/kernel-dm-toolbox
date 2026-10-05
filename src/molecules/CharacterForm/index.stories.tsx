import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CharacterForm } from '~/molecules/CharacterForm';

const classOptions = [
  { slug: 'srd-2024_barbarian', name: 'Barbarian', subclassOfSlug: null },
  { slug: 'srd-2024_wizard', name: 'Wizard', subclassOfSlug: null },
  {
    slug: 'srd-2024_wizard_evoker',
    name: 'Evoker',
    subclassOfSlug: 'srd-2024_wizard',
  },
];

const meta = {
  title: 'Molecules/CharacterForm',
  component: CharacterForm,
  args: {
    isSaving: false,
    submitLabel: 'Add character',
    classField: { mode: 'pick', options: classOptions },
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
      null,
    );
  },
};

export const PickingAClass: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Class' }));
    await userEvent.click(canvas.getByRole('option', { name: 'Wizard' }));
    await expect(
      canvas.getByRole('button', { name: 'Subclass' }),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Subclass' }));
    await userEvent.click(canvas.getByRole('option', { name: 'Evoker' }));
    await userEvent.type(canvas.getByLabelText('Name'), 'Hammie');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Add character' }),
    );

    await expect(args.onSubmit).toHaveBeenCalledWith(expect.anything(), {
      classSlug: 'srd-2024_wizard',
      subclassSlug: 'srd-2024_wizard_evoker',
    });
  },
};

export const Editing: Story = {
  args: {
    submitLabel: 'Save changes',
    initialValues: {
      name: 'Sigrid',
      playerName: 'Anna',
      armorClass: 20,
      maxHitPoints: 45,
      initiativeModifier: 2,
      level: 5,
    },
    classField: {
      mode: 'readonly',
      label: 'Barbarian 5',
      onOpenWizard: fn(),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Name')).toHaveValue('Sigrid');
    await expect(canvas.getByLabelText('Max HP')).toHaveValue(45);
    await expect(canvas.getByText('Barbarian 5')).toBeVisible();
  },
};

const onOpenWizard = fn();

export const EditingWithNoClassYet: Story = {
  args: {
    submitLabel: 'Save changes',
    initialValues: {
      name: 'Sigrid',
      playerName: 'Anna',
      armorClass: 20,
      maxHitPoints: 45,
      initiativeModifier: 2,
      level: 5,
    },
    classField: { mode: 'readonly', label: null, onOpenWizard },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Assign class' }));
    await expect(onOpenWizard).toHaveBeenCalledOnce();
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
