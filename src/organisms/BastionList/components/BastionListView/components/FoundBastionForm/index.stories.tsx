import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { FoundBastionForm } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm';

const meta = {
  title: 'Organisms/BastionList/BastionListView/FoundBastionForm',
  component: FoundBastionForm,
  args: {
    characters: [
      { id: 'sigrid', name: 'Sigrid', level: 9, canFound: true },
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
      ownerCharacterId: 'sigrid',
      name: 'Highwatch',
      crampedBasicType: 'bedroom',
      roomyBasicType: 'courtyard',
    });
  },
};

/** A member below level 5 is named, not offered. */
export const SomeoneTooLow: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Not yet level 5: Pip/)).toBeVisible();
    await expect(
      canvas.queryByRole('option', { name: /Pip/ }),
    ).not.toBeInTheDocument();
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
