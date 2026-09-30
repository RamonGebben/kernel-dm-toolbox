import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent } from 'storybook/test';
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
    size: { control: 'select', options: ['default', 'wide'] },
  },
} satisfies Meta<typeof Modal>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async ({ args }) => {
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await expect(args.onClose).toHaveBeenCalled();
  },
};

export const Closed: Story = {
  args: { isOpen: false },
  play: async () => {
    await expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  },
};

export const Wide: Story = {
  args: { size: 'wide' },
  play: async () => {
    await expect(screen.getByRole('dialog')).toBeVisible();
  },
};
