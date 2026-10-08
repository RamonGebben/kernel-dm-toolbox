import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { EventResolver } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/EventResolver';
import { updateEvent } from '~/organisms/BastionTurn/hooks/useBastionTurn';
import {
  STUDY,
  event,
  turnBastion,
} from '~/organisms/BastionTurn/storyFixtures';

const rolled = (roll: number, inputs = {}) =>
  updateEvent(
    updateEvent(event(), { roll }, turnBastion),
    { inputs },
    turnBastion,
  );

const meta = {
  title: 'Organisms/BastionTurn/TurnWizard/EventResolver',
  component: EventResolver,
  args: {
    event: rolled(53),
    playerName: 'Sigrid',
    bastion: turnBastion,
    onChange: fn(),
    onRollAgain: fn(),
    hasFollowUp: false,
  },
} satisfies Meta<typeof EventResolver>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Attack: Story = {
  args: { event: rolled(53, { ones: 2 }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('6d6')).toBeVisible();
    await expect(canvas.getByText('Outcome: −2 defenders')).toBeVisible();
  },
};

export const EnteringAttackLosses: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.clear(canvas.getByLabelText('Dice showing 1'));
    await userEvent.type(canvas.getByLabelText('Dice showing 1'), '1');

    await expect(args.onChange).toHaveBeenLastCalledWith({
      inputs: { ones: 1 },
    });
  },
};

/** With no defenders, the attack shuts a facility down instead. */
export const AttackWithNoDefenders: Story = {
  args: { bastion: { ...turnBastion, defenderCount: 0 } },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(
      canvas.getByLabelText('Facility the attack shuts down'),
      STUDY,
    );

    await expect(args.onChange).toHaveBeenCalledWith({
      outOfActionFacilityId: STUDY,
    });
  },
};

export const CriminalHirelingBribed: Story = {
  args: { event: rolled(57, { bribeRoll: 3, pay: 1 }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Outcome: −300 gp')).toBeVisible();
  },
};

export const ExtraordinaryOpportunityTaken: Story = {
  args: { event: rolled(60, { accept: 1 }) },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Outcome: −500 gp')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Roll the follow-up event' }),
    );
    await expect(args.onRollAgain).toHaveBeenCalledOnce();
  },
};

export const OpportunityAlreadyFollowedUp: Story = {
  args: { event: rolled(60, { accept: 1 }), hasFollowUp: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByRole('button', { name: 'Roll the follow-up event' }),
    ).not.toBeInTheDocument();
  },
};

export const FriendlyVisitors: Story = {
  args: { event: rolled(70, { roll: 4 }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Outcome: +400 gp')).toBeVisible();
  },
};

export const GuestSeekingSanctuary: Story = {
  args: { event: rolled(74, { kindRoll: 2, giftRoll: 2 }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/seeking sanctuary/)).toBeVisible();
    await expect(canvas.getByText('Outcome: +200 gp')).toBeVisible();
  },
};

export const RequestForAidFallsShort: Story = {
  args: { event: rolled(95, { help: 1, sent: 2, total: 6, rewardRoll: 4 }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('Outcome: +200 gp · −1 defender'),
    ).toBeVisible();
  },
};

export const Treasure: Story = {
  args: {
    event: { ...rolled(100, { tableRoll: 80 }), storageItem: 'Bag of Holding' },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('The treasure, as stored')).toHaveValue(
      'Bag of Holding',
    );
  },
};

export const AQuietWeek: Story = {
  args: { event: rolled(12) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByLabelText('Anything worth noting')).toBeVisible();
  },
};
