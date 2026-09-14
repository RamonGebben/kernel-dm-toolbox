import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ClassTemplateWizardView } from '~/organisms/ClassTemplateWizard/components/ClassTemplateWizardView';
import { emptyPlayerCharacterCombatDataForm } from '~/molecules/PlayerCharacterCombatDataForm';
import type { ClassOption } from '~/organisms/ClassTemplateWizard/components/ClassTemplateWizardView';

const classes: ClassOption[] = [
  { slug: 'srd-2024_barbarian', name: 'Barbarian', subclassOfSlug: null },
  { slug: 'srd-2024_wizard', name: 'Wizard', subclassOfSlug: null },
  {
    slug: 'srd-2024_berserker',
    name: 'Path of the Berserker',
    subclassOfSlug: 'srd-2024_barbarian',
  },
];

const meta = {
  title: 'Organisms/ClassTemplateWizard/ClassTemplateWizardView',
  component: ClassTemplateWizardView,
  args: {
    isOpen: true,
    onClose: fn(),
    characterName: 'Sigrid',
    step: 'pick',
    isPending: false,
    classes,
    initialClassSlug: '',
    initialSubclassSlug: '',
    initialLevel: 1,
    onSubmitPick: fn(),
    isConfirmingOverwrite: false,
    onCancelOverwrite: fn(),
    isApplying: false,
    onConfirmOverwrite: fn(),
    onBackToPick: fn(),
    spellOptions: [],
    combatDataInitialValues: emptyPlayerCharacterCombatDataForm,
    isSavingCombatData: false,
    onSubmitCombatData: fn(),
  },
} satisfies Meta<typeof ClassTemplateWizardView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const PickStep: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Class')).toBeVisible();
    await expect(canvas.getByLabelText('Level')).toBeVisible();
  },
};

export const PickStepWithSubclass: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(canvas.getByLabelText('Class'), 'Barbarian');
    await expect(canvas.getByLabelText('Subclass')).toBeVisible();
  },
};

export const PickStepConfirmingOverwrite: Story = {
  args: { initialClassSlug: 'srd-2024_barbarian', isConfirmingOverwrite: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Yes, overwrite' }),
    ).toBeVisible();
  },
};

export const Loading: Story = {
  args: { isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Loading class data')).toBeVisible();
  },
};

export const EditStep: Story = {
  args: { step: 'edit' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: '← Change class' }),
    ).toBeVisible();
    await expect(canvas.getByText('Spells')).toBeVisible();
    await expect(canvas.getByText('Spell Slots')).toBeVisible();
    await expect(canvas.getByText('Resources')).toBeVisible();
  },
};
