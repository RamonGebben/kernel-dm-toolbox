import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SinceStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/SinceStep';
import {
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
        /Still building: Build 8 squares of wall — 23 days to go/,
      ),
    ).toBeVisible();
    await expect(canvas.getByText(/Ask Wren what came of it/)).toBeVisible();
    await expect(
      canvas.getByLabelText('What the Arcane Study produced'),
    ).toHaveValue('Blank book');
  },
};

export const RecordingGoldEarned: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText('Gold earned by the Arcane Study'),
      '5',
    );

    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        completions: [
          expect.objectContaining({ facilityId: STUDY, goldGained: 5 }),
        ],
      }),
    );
  },
};
