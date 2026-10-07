import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SinceStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/SinceStep';
import {
  BARRACK,
  STUDY,
  turnContext,
  turnDraft,
} from '~/organisms/BastionTurn/storyFixtures';

const meta = {
  title: 'Organisms/BastionTurn/TurnWizard/SinceStep',
  component: SinceStep,
  args: { context: turnContext, draft: turnDraft(), onChange: fn() },
} satisfies Meta<typeof SinceStep>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WhatTheWeekBrought: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(
        /Still building: Build 8 squares of wall, 23 days to go/,
      ),
    ).toBeVisible();
    await expect(
      canvas.getByText(/Makes one blank book\. Filled in below/),
    ).toBeVisible();
    await expect(
      canvas.getByLabelText('What the Arcane Study produced'),
    ).toHaveValue('Blank book');
  },
};

export const RecordingHowMany: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText('How many from the Arcane Study'),
      '5',
    );

    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        completions: [
          expect.objectContaining({ facilityId: STUDY, quantity: 15 }),
        ],
      }),
    );
  },
};

/** A Barrack's recruits are the only thing to confirm: no item, no gold. */
export const RecruitsArriving: Story = {
  args: {
    context: {
      ...turnContext,
      bastions: turnContext.bastions.map(bastion => ({
        ...bastion,
        facilities: bastion.facilities.map(facility =>
          facility.id === BARRACK
            ? {
                ...facility,
                jobOptionKey: 'defenders',
                jobLabel: 'Recruit defenders',
                jobEffect: 'recruit-defenders' as const,
                jobQuantity: 3,
                jobDaysRemaining: 7,
                finishesThisTurn: true,
              }
            : { ...facility, finishesThisTurn: false },
        ),
      })),
    },
    draft: turnDraft({
      completions: [
        {
          facilityId: BARRACK,
          itemName: '',
          quantity: 1,
          goldGained: 0,
          defendersGained: 3,
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByLabelText('Defenders recruited by the Barrack'),
    ).toHaveValue(3);
    await expect(
      canvas.queryByLabelText('How many from the Barrack'),
    ).not.toBeInTheDocument();
    await expect(
      canvas.queryByLabelText('Gold earned by the Barrack'),
    ).not.toBeInTheDocument();
  },
};
