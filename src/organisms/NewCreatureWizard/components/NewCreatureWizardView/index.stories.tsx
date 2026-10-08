import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen } from 'storybook/test';
import { NewCreatureWizardView } from '~/organisms/NewCreatureWizard/components/NewCreatureWizardView';
import { emptyCustomCreatureForm } from '~/molecules/CustomCreatureForm';
import type { CreatureSummary } from '~/organisms/CreatureLibrary/components/CreatureLibraryView';

const creatures: Array<CreatureSummary> = [
  {
    source: 'library',
    slug: 'srd-2024_goblin',
    name: 'Goblin',
    challengeRatingLabel: '1/8',
  },
];

const meta = {
  title: 'Organisms/NewCreatureWizard/NewCreatureWizardView',
  component: NewCreatureWizardView,
  args: {
    isOpen: true,
    step: 'pick-base',
    search: '',
    creatures,
    isBasePickerPending: false,
    isBasePending: false,
    initialValues: null,
    baseKey: 'blank',
    isSaving: false,
    onSearchChange: fn(),
    onChooseBase: fn(),
    onBackToPickBase: fn(),
    onSubmit: fn(),
    onClose: fn(),
  },
} satisfies Meta<typeof NewCreatureWizardView>;

export default meta;

type Story = StoryObj<typeof meta>;

// `NewCreatureWizardView` renders entirely inside `Modal`, which is
// portalled to `document.body` — every query below goes through `screen`,
// not `within(canvasElement)`. See `Modal`'s own doc comment.

export const PickBaseStep: Story = {
  play: async () => {
    await expect(screen.getByText('New Creature')).toBeVisible();
    await expect(
      screen.getByRole('button', { name: 'Start blank' }),
    ).toBeVisible();
  },
};

export const FormStepBlank: Story = {
  args: { step: 'form', initialValues: emptyCustomCreatureForm },
  play: async () => {
    await expect(
      screen.getByLabelText('Name', { selector: '#custom-creature-name' }),
    ).toBeVisible();
  },
};

export const FormStepLoadingCopySource: Story = {
  args: { step: 'form', isBasePending: true, initialValues: null },
  play: async () => {
    await expect(
      screen.getByLabelText('Loading creature to copy'),
    ).toBeVisible();
  },
};
