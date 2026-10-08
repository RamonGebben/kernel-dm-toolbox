import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { EventsStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/EventsStep';
import {
  event,
  turnContext,
  turnDraft,
} from '~/organisms/BastionTurn/storyFixtures';

const meta = {
  title: 'Organisms/BastionTurn/TurnWizard/EventsStep',
  component: EventsStep,
  args: {
    context: turnContext,
    draft: turnDraft({ step: 'events', events: [event()] }),
    onChange: fn(),
  },
} satisfies Meta<typeof EventsStep>;

export default meta;

type Story = StoryObj<typeof meta>;

export const WaitingForTheRoll: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByLabelText(
        /Ask Sigrid's player to roll for the Bastion Event/,
      ),
    ).toHaveValue(null);
  },
};

export const TypingTheRoll: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(
      canvas.getByLabelText(
        /Ask Sigrid's player to roll for the Bastion Event/,
      ),
      '9',
    );

    await expect(args.onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        events: [expect.objectContaining({ roll: 9, key: 'all-is-well' })],
      }),
    );
  },
};

export const Rolled: Story = {
  args: {
    draft: turnDraft({
      step: 'events',
      events: [event({ roll: 53, key: 'attack' })],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Attack')).toBeVisible();
    await expect(canvas.getByLabelText('Dice showing 1')).toBeVisible();
  },
};

export const NoEvents: Story = {
  args: { draft: turnDraft({ step: 'events', events: [] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/no Bastion Events to roll/)).toBeVisible();
  },
};
