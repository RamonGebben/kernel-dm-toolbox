import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  CustomCreatureForm,
  emptyCustomCreatureForm,
  type CustomCreatureFormValues,
} from '~/molecules/CustomCreatureForm';

const goblinBoss: CustomCreatureFormValues = {
  ...emptyCustomCreatureForm,
  name: 'Goblin Boss',
  size: 'small',
  type: 'humanoid',
  alignment: 'neutral evil',
  challengeRating: 1,
  armorClass: 17,
  armorDetail: 'chain shirt, shield',
  hitPoints: 21,
  hitDice: '6d6',
  initiativeBonus: '2',
  abilityScores: {
    Strength: 10,
    Dexterity: 14,
    Constitution: 10,
    Intelligence: 10,
    Wisdom: 9,
    Charisma: 10,
  },
  skills: { ...emptyCustomCreatureForm.skills, Stealth: '6' },
  passivePerception: 9,
  languagesDesc: 'Common, Goblin',
  traits: [
    {
      name: 'Nimble Escape',
      desc: 'The goblin can take the Disengage or Hide action as a bonus action.',
      type: '',
    },
  ],
  actions: [
    {
      name: 'Scimitar',
      desc: 'Melee Weapon Attack.',
      actionType: 'ACTION',
      legendaryActionCost: '',
      attack: {
        name: 'Scimitar',
        attackType: 'Melee Weapon Attack',
        toHitMod: '4',
        reach: '5',
        range: '',
        longRange: '',
        targetCreatureOnly: false,
        damageDieCount: '1',
        damageDieType: 'd6',
        damageBonus: '2',
        damageType: 'slashing',
        extraDamageDieCount: '',
        extraDamageDieType: '',
        extraDamageBonus: '',
        extraDamageType: '',
      },
    },
  ],
};

const meta = {
  title: 'Molecules/CustomCreatureForm',
  component: CustomCreatureForm,
  args: {
    isSaving: false,
    submitLabel: 'Create Creature',
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof CustomCreatureForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Blank: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Name'), 'Cave Bear');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Create Creature' }),
    );

    await expect(args.onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Cave Bear' }),
    );
  },
};

export const Editing: Story = {
  args: { submitLabel: 'Save Changes', initialValues: goblinBoss },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByLabelText('Name', { selector: '#custom-creature-name' }),
    ).toHaveValue('Goblin Boss');
    await expect(canvas.getByLabelText('AC')).toHaveValue(17);
    await expect(canvas.getByLabelText('DEX')).toHaveValue(14);
  },
};

export const Saving: Story = {
  args: { isSaving: true, initialValues: goblinBoss },
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

export const AddingATraitAndAction: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Add trait' }));
    await expect(
      canvas.getByLabelText('Name', {
        selector: '#custom-creature-trait-name-0',
      }),
    ).toBeVisible();

    await userEvent.click(canvas.getByRole('button', { name: 'Add action' }));
    await userEvent.click(
      canvas.getByLabelText('Has a structured attack roll'),
    );
    await expect(canvas.getByLabelText('To Hit')).toBeVisible();
  },
};
