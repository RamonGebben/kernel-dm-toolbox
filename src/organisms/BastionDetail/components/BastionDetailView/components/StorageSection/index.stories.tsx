import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { StorageSection } from '~/organisms/BastionDetail/components/BastionDetailView/components/StorageSection';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/StorageSection',
  component: StorageSection,
  args: {
    items: [
      {
        id: 'i1',
        name: 'Potion of Healing',
        valueGp: null,
        quantity: 2,
        note: 'From the Greenhouse',
        claimedBy: null,
        claimedAt: null,
      },
      {
        id: 'i2',
        name: 'Arcane Focus',
        valueGp: null,
        quantity: 1,
        note: null,
        claimedBy: { id: 'sigrid', name: 'Sigrid' },
        claimedAt: new Date('2026-01-01'),
      },
    ],
    characters: [
      { id: 'sigrid', name: 'Sigrid' },
      { id: 'hammie', name: 'Hammie' },
    ],
    onAdd: fn(),
    onClaim: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof StorageSection>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Loaded: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Potion of Healing ×2/)).toBeVisible();
    await expect(canvas.getByLabelText('Who claimed Arcane Focus')).toHaveValue(
      'sigrid',
    );
  },
};

export const Claiming: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(
      canvas.getByLabelText('Who claimed Potion of Healing'),
      'hammie',
    );

    await expect(args.onClaim).toHaveBeenCalledWith('i1', 'hammie');
  },
};

export const Storing: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.type(canvas.getByLabelText('Item'), 'Holy Water');
    await userEvent.clear(canvas.getByLabelText('Quantity'));
    await userEvent.type(canvas.getByLabelText('Quantity'), '3');
    await userEvent.click(canvas.getByRole('button', { name: 'Store' }));

    await expect(args.onAdd).toHaveBeenCalledWith({
      name: 'Holy Water',
      quantity: 3,
    });
  },
};

/** Goods a Storehouse bought show what they are worth. */
export const TradeGoods: Story = {
  args: {
    items: [
      {
        id: 'i3',
        name: 'Silk',
        valueGp: 300,
        quantity: 1,
        note: 'From the Storehouse',
        claimedBy: null,
        claimedAt: null,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/worth 300 gp/)).toBeVisible();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Nothing in storage.')).toBeVisible();
    await expect(canvas.getByRole('button', { name: 'Store' })).toBeDisabled();
  },
};
