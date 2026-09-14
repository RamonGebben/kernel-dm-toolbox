import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, within } from 'storybook/test';
import {
  PlayerCharacterCombatDataForm,
  type PlayerCharacterCombatDataFormValues,
  type SpellOption,
} from '~/molecules/PlayerCharacterCombatDataForm';

const availableSpells: SpellOption[] = [
  { slug: 'srd-2024_fire-bolt', name: 'Fire Bolt' },
  { slug: 'srd-2024_magic-missile', name: 'Magic Missile' },
];

const seededValues: PlayerCharacterCombatDataFormValues = {
  actions: [
    {
      name: 'Longsword',
      desc: 'Melee Weapon Attack.',
      actionType: 'ACTION',
      legendaryActionCost: '',
      attack: {
        name: 'Longsword',
        attackType: 'Melee Weapon Attack',
        toHitMod: '5',
        reach: '5',
        range: '',
        longRange: '',
        targetCreatureOnly: false,
        damageDieCount: '1',
        damageDieType: 'd8',
        damageBonus: '3',
        damageType: 'slashing',
        extraDamageDieCount: '',
        extraDamageDieType: '',
        extraDamageBonus: '',
        extraDamageType: '',
      },
    },
  ],
  spells: [
    {
      spellSlug: 'srd-2024_fire-bolt',
      name: 'Fire Bolt',
      isPrepared: true,
      isAlwaysAvailable: true,
    },
  ],
  spellSlots: Array.from({ length: 9 }, (_unused, index) => ({
    spellLevel: index + 1,
    maxSlots: index === 0 ? '4' : '0',
  })),
  resources: [
    {
      resourceKey: 'rage',
      name: 'Rage',
      maxUses: '2',
      isUnlimited: false,
      resetsOn: 'LONG_REST',
    },
  ],
};

const meta = {
  title: 'Molecules/PlayerCharacterCombatDataForm',
  component: PlayerCharacterCombatDataForm,
  args: {
    isSaving: false,
    availableSpells,
    onSubmit: fn(),
  },
} satisfies Meta<typeof PlayerCharacterCombatDataForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Spells')).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Add action' }),
    ).toBeVisible();
  },
};

export const Seeded: Story = {
  args: { initialValues: seededValues },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByLabelText('Name', {
        selector: '#custom-creature-action-name-0',
      }),
    ).toHaveValue('Longsword');
    await expect(canvas.getByText('Fire Bolt')).toBeVisible();
    await expect(canvas.getByDisplayValue('Rage')).toBeVisible();
  },
};

export const Saving: Story = {
  args: { initialValues: seededValues, isSaving: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Saving…' }),
    ).toBeDisabled();
  },
};
