import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { TurnWizard } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard';
import {
  SIGRID,
  event,
  turnContext,
  turnDraft,
} from '~/organisms/BastionTurn/storyFixtures';

const meta = {
  title: 'Organisms/BastionTurn/TurnWizard',
  component: TurnWizard,
  args: {
    context: turnContext,
    initialDraft: turnDraft(),
    isSaving: false,
    error: null,
    preview: null,
    isPreviewing: false,
    onSave: fn(async () => undefined),
    onRequestPreview: fn(),
    onDiscard: fn(),
    onCommit: fn(async () => undefined),
  },
} satisfies Meta<typeof TurnWizard>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Each step saves the draft, so a reload resumes where the DM was. */
export const SavingAtEachStep: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('1. Since last turn')).toHaveAttribute(
      'aria-current',
      'step',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: "Next: Who's home" }),
    );

    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({ step: 'presence' }),
    );
    await expect(canvas.getByText("2. Who's home")).toHaveAttribute(
      'aria-current',
      'step',
    );
  },
};

/** Leaving "Who's home" gives everyone who maintains an event to roll. */
export const MaintainingAddsAnEvent: Story = {
  args: {
    initialDraft: turnDraft({
      step: 'presence',
      actors: turnDraft().actors.map(actor =>
        actor.characterId === SIGRID ? { ...actor, isPresent: false } : actor,
      ),
    }),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Next: Orders' }));

    await expect(args.onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        step: 'orders',
        events: [expect.objectContaining({ characterId: SIGRID, roll: 0 })],
      }),
    );
  },
};

export const EventsStillToRoll: Story = {
  args: { initialDraft: turnDraft({ step: 'events', events: [event()] }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('1 Bastion Event still to roll.'),
    ).toBeVisible();
    await expect(
      canvas.getByRole('button', { name: 'Next: Review' }),
    ).toBeDisabled();
  },
};

export const ReadyToCommit: Story = {
  args: {
    initialDraft: turnDraft({ step: 'review' }),
    preview: {
      ok: true,
      lines: ['A quiet week.'],
      treasuryDelta: 0,
      storedItems: [],
    },
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Commit turn 4' }),
    );

    await expect(args.onSave).toHaveBeenCalled();
    await expect(args.onCommit).toHaveBeenCalledOnce();
  },
};

export const CannotCommitYet: Story = {
  args: {
    initialDraft: turnDraft({ step: 'review' }),
    preview: {
      ok: false,
      problems: ['Sigrid maintains but has no Bastion Event rolled.'],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Commit turn 4' }),
    ).toBeDisabled();
  },
};

export const Discarding: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Discard turn' }));
    await userEvent.click(
      canvas.getByRole('button', { name: 'Discard this turn' }),
    );

    await expect(args.onDiscard).toHaveBeenCalledOnce();
  },
};
