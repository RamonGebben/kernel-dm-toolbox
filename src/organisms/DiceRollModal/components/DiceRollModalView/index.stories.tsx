import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { DiceRollModalView } from '~/organisms/DiceRollModal/components/DiceRollModalView';

const combatants = [
  { id: 'combatant-1', displayName: 'Adult Black Dragon', currentHitPoints: 195, maxHitPoints: 195 },
  { id: 'combatant-2', displayName: 'Aurelia', currentHitPoints: 42, maxHitPoints: 48 },
];

const meta = {
  title: 'Organisms/DiceRollModal/DiceRollModalView',
  component: DiceRollModalView,
  args: {
    sides: 6,
    modifier: 6,
    initialCount: 2,
    canApplyToCombatants: false,
    combatants: [],
    isApplying: false,
    onClose: fn(),
    onApply: fn(),
  },
} satisfies Meta<typeof DiceRollModalView>;

export default meta;

type Story = StoryObj<typeof meta>;

/** A roll from spell text: no apply section, since it isn't tied to a fight. */
export const SpellRoll: Story = {};

export const CreatureRollBeforeApplying: Story = {
  args: { canApplyToCombatants: true, combatants },
};

export const CreatureRollWithNoCombatants: Story = {
  args: { canApplyToCombatants: true, combatants: [] },
};

export const RollingShowsTheBreakdownAndTotal: Story = {
  args: { canApplyToCombatants: true, combatants },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Roll' }));

    await expect(canvas.getByText(/^Rolls: /)).toBeInTheDocument();
    await expect(canvas.getByText(/^Total: \d+$/)).toBeInTheDocument();
  },
};

export const ApplyingToACheckedTargetUsesTheFullTotal: Story = {
  args: { canApplyToCombatants: true, combatants },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Roll' }));
    const totalText = canvas.getByText(/^Total: \d+$/).textContent ?? '';
    const total = Number.parseInt(totalText.replace('Total: ', ''), 10);

    const checkbox = canvas.getByRole('checkbox', {
      name: /Adult Black Dragon/,
    });
    await userEvent.click(checkbox);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Apply as Damage' }),
    );

    await expect(args.onApply).toHaveBeenCalledWith('damage', [
      { id: 'combatant-1', amount: total },
    ]);
  },
};

export const ApplyIsDisabledWithNoTargetChecked: Story = {
  args: { canApplyToCombatants: true, combatants },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Roll' }));

    await expect(
      canvas.getByRole('button', { name: 'Apply as Damage' }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole('button', { name: 'Apply as Heal' }),
    ).toBeDisabled();
  },
};
