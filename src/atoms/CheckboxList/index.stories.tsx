import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { CheckboxList } from '~/atoms/CheckboxList';

const meta = {
  title: 'Atoms/CheckboxList',
  component: CheckboxList,
  args: {
    label: 'Type',
    options: [
      { value: 'aberration', label: 'Aberration' },
      { value: 'dragon', label: 'Dragon' },
      { value: 'undead', label: 'Undead' },
    ],
    selectedValues: [],
    onChange: fn(),
    disabled: false,
  },
} satisfies Meta<typeof CheckboxList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Ticking: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Dragon' }));

    await expect(args.onChange).toHaveBeenCalledWith(['dragon']);
  },
};

export const Unticking: Story = {
  args: { selectedValues: ['dragon', 'undead'] },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('checkbox', { name: 'Dragon' }));

    await expect(args.onChange).toHaveBeenCalledWith(['undead']);
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('checkbox', { name: 'Dragon' }),
    ).toBeDisabled();
  },
};
