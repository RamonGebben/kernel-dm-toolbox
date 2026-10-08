import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { PendingFreeRooms } from '~/organisms/BastionDetail/components/BastionDetailView/components/PendingFreeRooms';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/PendingFreeRooms',
  component: PendingFreeRooms,
  args: {
    members: [{ id: 'hammie', name: 'Hammie' }],
    onAdd: fn(),
  },
} satisfies Meta<typeof PendingFreeRooms>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AddingALateMembersRooms: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Hammie has reached level 5/)).toBeVisible();
    await userEvent.selectOptions(
      canvas.getByLabelText("Hammie's free Roomy room"),
      'courtyard',
    );
    await userEvent.click(
      canvas.getByRole('button', { name: "Add Hammie's rooms" }),
    );

    await expect(args.onAdd).toHaveBeenCalledWith({
      characterId: 'hammie',
      crampedBasicType: 'bedroom',
      roomyBasicType: 'courtyard',
    });
  },
};

export const NobodyWaiting: Story = {
  args: { members: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByRole('region', { name: 'Free rooms to add' }),
    ).not.toBeInTheDocument();
  },
};
