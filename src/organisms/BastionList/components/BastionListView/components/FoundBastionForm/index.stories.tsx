import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { FoundBastionForm } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm';

const meta = {
  title: 'Organisms/BastionList/BastionListView/FoundBastionForm',
  component: FoundBastionForm,
  args: {
    mode: 'per-character',
    characters: [
      { id: 'sigrid', name: 'Sigrid', level: 9, canFound: true },
      { id: 'hammie', name: 'Hammie', level: 5, canFound: true },
      { id: 'kid', name: 'Pip', level: 3, canFound: false },
    ],
    isSaving: false,
    error: null,
    onSubmit: fn(),
    onCancel: fn(),
  },
} satisfies Meta<typeof FoundBastionForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Founding: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Name'), 'Highwatch');
    await userEvent.selectOptions(
      canvas.getByLabelText('Free Roomy room'),
      'courtyard',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Found bastion' }),
    );

    await expect(args.onSubmit).toHaveBeenCalledWith({
      mode: 'per-character',
      ownerCharacterId: 'sigrid',
      name: 'Highwatch',
      crampedBasicType: 'bedroom',
      roomyBasicType: 'courtyard',
    });
  },
};

/** Every level 5+ member brings their own two rooms to the shared bastion. */
export const FoundingForTheParty: Story = {
  args: { mode: 'party' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.queryByLabelText('Owner')).not.toBeInTheDocument();
    await userEvent.type(canvas.getByLabelText('Name'), 'The Hall');
    const hammie = within(
      canvas.getByRole('group', { name: "Hammie's free rooms" }),
    );
    await userEvent.selectOptions(
      hammie.getByLabelText('Free Cramped room'),
      'parlor',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Found bastion' }),
    );

    await expect(args.onSubmit).toHaveBeenCalledWith({
      mode: 'party',
      name: 'The Hall',
      members: [
        {
          characterId: 'sigrid',
          crampedBasicType: 'bedroom',
          roomyBasicType: 'kitchen',
        },
        {
          characterId: 'hammie',
          crampedBasicType: 'parlor',
          roomyBasicType: 'kitchen',
        },
      ],
    });
    await expect(
      canvas.getByText(/bring their rooms once they get there/),
    ).toBeVisible();
  },
};

export const NobodyEligible: Story = {
  args: {
    characters: [{ id: 'kid', name: 'Pip', level: 3, canFound: false }],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(/Nobody can found a bastion right now/),
    ).toBeVisible();
  },
};

export const RefusedByTheServer: Story = {
  args: { error: 'Sigrid already has a bastion.' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('alert')).toHaveTextContent(
      'Sigrid already has a bastion.',
    );
  },
};
