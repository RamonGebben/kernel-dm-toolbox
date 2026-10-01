import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { BastionModeSwitch } from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch';

const meta = {
  title: 'Organisms/BastionList/BastionListView/BastionModeSwitch',
  component: BastionModeSwitch,
  args: {
    mode: 'per-character',
    bastionCount: 2,
    suggestedName: 'Highwatch',
    members: [
      { id: 'sigrid', name: 'Sigrid' },
      { id: 'hammie', name: 'Hammie' },
    ],
    isSwitching: false,
    error: null,
    onSwitch: fn(async () => undefined),
  },
} satisfies Meta<typeof BastionModeSwitch>;

export default meta;

type Story = StoryObj<typeof meta>;

export const MergingIntoAPartyBastion: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('One per character')).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Switch to one for the whole party' }),
    );
    await expect(
      screen.getByText(/The 2 bastions merge into one/),
    ).toBeVisible();
    await userEvent.clear(screen.getByLabelText('Name of the party bastion'));
    await userEvent.type(
      screen.getByLabelText('Name of the party bastion'),
      'The Hall',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Switch' }));

    await expect(args.onSwitch).toHaveBeenCalledWith({
      mode: 'party',
      name: 'The Hall',
    });
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const SplittingBackOut: Story = {
  args: { mode: 'party', bastionCount: 1 },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Switch to one per character' }),
    );
    await userEvent.selectOptions(
      screen.getByLabelText('Who keeps the defenders, walls and storage?'),
      'hammie',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Switch' }));

    await expect(args.onSwitch).toHaveBeenCalledWith({
      mode: 'per-character',
      keeperCharacterId: 'hammie',
    });
  },
};

/** Nothing founded yet: the switch just changes the setting. */
export const NothingToMerge: Story = {
  args: { bastionCount: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Switch to one for the whole party' }),
    );

    await expect(
      screen.getByText(/The party will share one bastion/),
    ).toBeVisible();
    await expect(
      screen.queryByLabelText('Name of the party bastion'),
    ).not.toBeInTheDocument();
  },
};

export const Refused: Story = {
  args: { error: 'Choose who keeps the shared parts of the bastion.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /Switch to/ }));

    await expect(screen.getByRole('alert')).toHaveTextContent(
      'Choose who keeps',
    );
  },
};
