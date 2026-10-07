import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { BastionTurnView } from '~/organisms/BastionTurn/components/BastionTurnView';
import { turnContext, turnDraft } from '~/organisms/BastionTurn/storyFixtures';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView',
  component: BastionTurnView,
  args: {
    isPending: false,
    context: turnContext,
    turn: null,
    history: [],
    isSaving: false,
    error: null,
    preview: null,
    isPreviewing: false,
    onStart: fn(async () => undefined),
    onSave: fn(async () => undefined),
    onRequestPreview: fn(),
    onDiscard: fn(),
    onCommit: fn(async () => ({ lines: ['A quiet week.'] })),
  },
} satisfies Meta<typeof BastionTurnView>;

export default meta;

type Story = StoryObj<typeof meta>;

export const NothingUnderWay: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Next up: bastion turn 4/)).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Start bastion turn' }),
    );

    await expect(args.onStart).toHaveBeenCalledOnce();
  },
};

export const ResumingATurn: Story = {
  args: { turn: { id: 't4', number: 4, draft: turnDraft({ step: 'orders' }) } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Resume turn 4' }),
    );

    await expect(screen.getByText('3. Orders')).toHaveAttribute(
      'aria-current',
      'step',
    );
  },
};

/** After the commit the turn is gone, but its summary stays on screen. */
export const DoneSummary: Story = {
  args: {
    turn: {
      id: 't4',
      number: 4,
      draft: turnDraft({ step: 'review' }),
    },
    preview: {
      ok: true,
      lines: ['A quiet week.'],
      treasuryDelta: 0,
      storedItems: [],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Resume turn 4' }),
    );
    await userEvent.click(
      screen.getByRole('button', { name: 'Commit turn 4' }),
    );

    await expect(screen.getByText('Turn 4 is done')).toBeVisible();
    await expect(screen.getByText('A quiet week.')).toBeVisible();
  },
};

export const PastTurns: Story = {
  args: {
    history: [
      {
        id: 't3',
        number: 3,
        committedAt: new Date('2026-01-01'),
        lines: ['Wren: Arcane Study, Blank book (10 gp).'],
        treasuryDelta: -10,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Turn log' }));

    await expect(screen.getByText(/Turn 3 · treasury −10 gp/)).toBeVisible();
  },
};

export const NoBastions: Story = {
  args: { context: { ...turnContext, bastions: [] } },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toBeEmptyDOMElement();
  },
};
