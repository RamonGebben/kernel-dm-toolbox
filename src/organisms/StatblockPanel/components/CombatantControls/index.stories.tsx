import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CombatantControls } from '~/organisms/StatblockPanel/components/CombatantControls';

const meta = {
  title: 'Organisms/StatblockPanel/CombatantControls',
  component: CombatantControls,
  args: {
    displayName: 'Meat',
    currentHitPoints: 35,
    maxHitPoints: 52,
    temporaryHitPoints: 0,
    isHidden: false,
    isPending: false,
    conditions: [],
    conditionOptions: [
      { slug: 'srd-2024_poisoned', name: 'Poisoned' },
      { slug: 'srd-2024_prone', name: 'Prone' },
    ],
    onDamage: fn(),
    onHeal: fn(),
    onGrantTemporary: fn(),
    onToggleHidden: fn(),
    onApplyCondition: fn(),
    onRemoveCondition: fn(),
  },
} satisfies Meta<typeof CombatantControls>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Amount'), '17');
    await userEvent.click(canvas.getByRole('button', { name: 'Damage' }));

    await expect(args.onDamage).toHaveBeenCalledWith(17);
  },
};

/** The ambush case: a combatant the players must not see on the second screen. */
export const Hidden: Story = {
  args: { isHidden: true, displayName: 'Assassin' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    const toggle = canvas.getByRole('button', { name: 'Reveal to players' });
    await expect(toggle).toHaveAttribute('aria-pressed', 'true');

    await userEvent.click(toggle);
    await expect(args.onToggleHidden).toHaveBeenCalledOnce();
  },
};

export const ApplyingACondition: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(
      canvas.getByLabelText('Condition'),
      'srd-2024_poisoned',
    );
    await userEvent.type(canvas.getByLabelText('Rounds'), '3');
    await userEvent.click(canvas.getByRole('button', { name: 'Apply' }));

    await expect(args.onApplyCondition).toHaveBeenCalledWith({
      conditionSlug: 'srd-2024_poisoned',
      roundsRemaining: 3,
    });
  },
};

export const WithConditionsApplied: Story = {
  args: {
    conditions: [
      { id: 'c1', name: 'Poisoned', roundsRemaining: 3, note: null },
    ],
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Poisoned' }),
    );

    await expect(args.onRemoveCondition).toHaveBeenCalledWith('c1');
  },
};

export const Saving: Story = {
  args: { isPending: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Amount'), '5');

    await expect(canvas.getByRole('button', { name: 'Damage' })).toBeDisabled();
  },
};
