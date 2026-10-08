import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { BasicFacilitiesSection } from '~/organisms/BastionDetail/components/BastionDetailView/components/BasicFacilitiesSection';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/BasicFacilitiesSection',
  component: BasicFacilitiesSection,
  args: {
    facilities: [
      {
        id: 'bed',
        type: 'bedroom',
        label: 'Bedroom',
        space: 'cramped',
        enlarge: { to: 'roomy', costGp: 500, days: 25 },
        isBeingEnlarged: false,
      },
      {
        id: 'kit',
        type: 'kitchen',
        label: 'Kitchen',
        space: 'vast',
        enlarge: null,
        isBeingEnlarged: false,
      },
    ],
    treasuryGold: 2000,
    onBuild: fn(),
    onAddExisting: fn(),
    onEnlarge: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof BasicFacilitiesSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Building: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(canvas.getByLabelText('Room'), 'parlor');
    await userEvent.selectOptions(canvas.getByLabelText('Size'), 'roomy');
    await userEvent.click(
      canvas.getByRole('button', { name: 'Build (1,000 gp, 45 days)' }),
    );

    await expect(args.onBuild).toHaveBeenCalledWith('parlor', 'roomy');
  },
};

export const AddingOneThatIsAlreadyThere: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Add as already built' }),
    );

    await expect(args.onAddExisting).toHaveBeenCalledWith('bedroom', 'cramped');
  },
};

/** A Vast build the treasury cannot pay for is off; enlarging stops at Vast. */
export const CannotAfford: Story = {
  args: { treasuryGold: 400 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: /^Build/ })).toBeDisabled();
    await expect(
      canvas.queryByRole('button', { name: /Enlarge Kitchen/ }),
    ).not.toBeInTheDocument();
  },
};

export const Enlarging: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Enlarge Bedroom to Roomy' }),
    );

    await expect(args.onEnlarge).toHaveBeenCalledWith('bed');
  },
};
