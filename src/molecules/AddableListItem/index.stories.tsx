import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { AddableListItem } from '~/molecules/AddableListItem';

const meta = {
  title: 'Molecules/AddableListItem',
  component: AddableListItem,
  args: {
    name: 'Goblin',
    subtitle: 'CR 1/4',
    onAdd: fn(),
  },
} satisfies Meta<typeof AddableListItem>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Adding: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Add Goblin' }));

    await expect(args.onAdd).toHaveBeenCalledOnce();
  },
};

export const WithAClassSubtitle: Story = {
  args: { name: 'Ari', subtitle: 'Fighter 4' },
};
