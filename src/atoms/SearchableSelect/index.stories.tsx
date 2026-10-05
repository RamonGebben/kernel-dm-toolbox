import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SearchableSelect } from '~/atoms/SearchableSelect';

const options = [
  { value: 'barbarian', label: 'Barbarian' },
  { value: 'bard', label: 'Bard' },
  { value: 'cleric', label: 'Cleric' },
  { value: 'wizard', label: 'Wizard' },
];

const meta = {
  title: 'Atoms/SearchableSelect',
  component: SearchableSelect,
  args: {
    label: 'Class',
    placeholder: 'Choose a class…',
    options,
    value: '',
    onChange: fn(),
  },
} satisfies Meta<typeof SearchableSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Choose a class…')).toBeVisible();
  },
};

export const WithASelection: Story = {
  args: { value: 'wizard' },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Class' }),
    ).toHaveTextContent('Wizard');
  },
};

export const Opening: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Class' }));
    await expect(canvas.getByRole('listbox')).toBeVisible();
    await expect(
      canvas.getByRole('option', { name: 'Barbarian' }),
    ).toBeVisible();
  },
};

export const Filtering: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Class' }));
    await userEvent.type(canvas.getByPlaceholderText('Search…'), 'bar');

    await expect(
      canvas.getByRole('option', { name: 'Barbarian' }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('option', { name: 'Wizard' }),
    ).not.toBeInTheDocument();
  },
};

export const Selecting: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Class' }));
    await userEvent.click(canvas.getByRole('option', { name: 'Cleric' }));

    await expect(args.onChange).toHaveBeenCalledWith('cleric');
  },
};

export const ClearingASelection: Story = {
  args: { value: 'wizard' },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Class' }));
    await userEvent.click(
      canvas.getByRole('option', { name: 'Choose a class…' }),
    );

    await expect(args.onChange).toHaveBeenCalledWith('');
  },
};

export const NoMatches: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Class' }));
    await userEvent.type(canvas.getByPlaceholderText('Search…'), 'xyz');

    await expect(canvas.getByText('No matches')).toBeVisible();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: 'Class' })).toBeDisabled();
  },
};
