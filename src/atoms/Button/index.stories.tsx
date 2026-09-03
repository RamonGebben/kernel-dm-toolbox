import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Button } from '~/atoms/Button';

/**
 * Every component input is driven through an arg, so the story file doubles as
 * the component's manual test surface and as its documentation.
 */
const meta = {
  title: 'Atoms/Button',
  component: Button,
  args: {
    children: 'Roll initiative',
    variant: 'primary',
    size: 'md',
    isFullWidth: false,
    disabled: false,
    onClick: fn(),
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['primary', 'secondary', 'ghost'],
    },
    size: { control: 'radio', options: ['sm', 'md'] },
    isFullWidth: { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const Secondary: Story = {
  args: { variant: 'secondary' },
};

export const Ghost: Story = {
  args: { variant: 'ghost' },
};

export const Small: Story = {
  args: { size: 'sm' },
};

export const FullWidth: Story = {
  args: { isFullWidth: true },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button', { name: 'Roll initiative' });

    await expect(button).toBeDisabled();
    await userEvent.click(button);
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

export const Clicked: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Roll initiative' }),
    );

    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};
