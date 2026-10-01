import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PresenceStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/PresenceStep';
import {
  SIGRID,
  turnContext,
  turnDraft,
} from '~/organisms/BastionTurn/storyFixtures';

const meta = {
  title: 'Organisms/BastionTurn/TurnWizard/PresenceStep',
  component: PresenceStep,
  args: {
    context: turnContext,
    draft: turnDraft({ step: 'presence' }),
    onChange: fn(),
  },
} satisfies Meta<typeof PresenceStep>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Each party member is asked in turn. */
export const AskingEachMember: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Is Sigrid at The Hall/)).toBeVisible();
    await expect(canvas.getByText(/Is Wren at The Hall/)).toBeVisible();
  },
};

export const SomeoneAway: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const sigrid = within(canvas.getByLabelText('Sigrid'));

    await userEvent.click(sigrid.getByLabelText(/Away/));

    await expect(args.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        actors: expect.arrayContaining([
          expect.objectContaining({ characterId: SIGRID, isPresent: false }),
        ]),
      }),
    );
  },
};

export const ChoosingToMaintain: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const sigrid = within(canvas.getByLabelText('Sigrid'));

    await userEvent.click(sigrid.getByLabelText(/Maintains/));

    await expect(args.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        actors: expect.arrayContaining([
          expect.objectContaining({ characterId: SIGRID, maintain: true }),
        ]),
      }),
    );
  },
};
