import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { MultiSelectFilter } from '~/atoms/MultiSelectFilter';

const meta = {
  title: 'Atoms/MultiSelectFilter',
  component: MultiSelectFilter,
  args: {
    label: 'Class',
    options: [
      { value: 'srd-2024_bard', label: 'Bard' },
      { value: 'srd-2024_cleric', label: 'Cleric' },
      { value: 'srd-2024_wizard', label: 'Wizard' },
    ],
    selectedValues: [],
    onChange: fn(),
    disabled: false,
  },
} satisfies Meta<typeof MultiSelectFilter>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: /class/i })).toBeVisible();
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
  },
};

export const OpensToACheckboxList: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /class/i }));

    // The checkbox list is portalled to `document.body`, so it's found via
    // `screen`, not `canvas` — see `MultiSelectFilter`'s own doc comment.
    await expect(screen.getByRole('checkbox', { name: 'Bard' })).toBeVisible();
    await expect(
      screen.getByRole('checkbox', { name: 'Wizard' }),
    ).toBeVisible();
  },
};

export const TogglingACheckboxReportsEverySelectedValue: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: /class/i }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Wizard' }));

    await expect(args.onChange).toHaveBeenCalledWith(['srd-2024_wizard']);
  },
};

/** The trigger shows a count once something is selected. */
export const WithSelections: Story = {
  args: { selectedValues: ['srd-2024_bard', 'srd-2024_wizard'] },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: /class \(2\)/i }),
    ).toBeVisible();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: /class/i })).toBeDisabled();
  },
};
