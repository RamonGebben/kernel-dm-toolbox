import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { Modal } from '~/atoms/Modal';

const meta = {
  title: 'Atoms/Modal',
  component: Modal,
  args: {
    title: 'Roll for initiative',
    isOpen: true,
    onClose: fn(),
    children: <p>Anything can go in the body.</p>,
  },
  argTypes: {
    isOpen: { control: 'boolean' },
    title: { control: 'text' },
  },
} satisfies Meta<typeof Modal>;

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

    await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
  },
};
