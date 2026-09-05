import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SidePanel } from '~/atoms/SidePanel';

const meta = {
  title: 'Atoms/SidePanel',
  component: SidePanel,
  args: {
    title: 'Fireball',
    isOpen: true,
    onClose: fn(),
    children: <p>Anything can go in the body.</p>,
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    title: { control: 'text' },
  },
} satisfies Meta<typeof SidePanel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Close' }));

    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const Closed: Story = {
  args: { isOpen: false },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByRole('button', { name: 'Close' }),
    ).not.toBeInTheDocument();
  },
};
