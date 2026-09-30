import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, screen, userEvent, within } from 'storybook/test';
import { CheckboxList } from '~/atoms/CheckboxList';
import { FilterBar } from '~/molecules/FilterBar';

const typeOptions = [
  { value: 'dragon', label: 'Dragon' },
  { value: 'undead', label: 'Undead' },
];

const onTypesChange = fn();
const onClearType = fn();
const onClearSource = fn();

const meta = {
  title: 'Molecules/FilterBar',
  component: FilterBar,
  args: {
    disabled: false,
    filters: [
      {
        key: 'source',
        label: 'Source',
        summary: null,
        editor: <p>Source controls</p>,
        onClear: onClearSource,
      },
      {
        key: 'type',
        label: 'Type',
        summary: null,
        editor: (
          <CheckboxList
            label="Type"
            options={typeOptions}
            selectedValues={[]}
            onChange={onTypesChange}
          />
        ),
        onClear: onClearType,
      },
    ],
  },
} satisfies Meta<typeof FilterBar>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Nothing applied: the bar is a single "+ Filter" button. */
export const Empty: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: '+ Filter' }),
    ).toBeVisible();
    await expect(
      canvas.queryByRole('button', { name: /^Type:/ }),
    ).not.toBeInTheDocument();
  },
};

export const AddingAFilter: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: '+ Filter' }));
    // Portalled to `document.body`, so found via `screen`.
    await userEvent.click(screen.getByRole('button', { name: 'Type' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Dragon' }));

    await expect(onTypesChange).toHaveBeenCalledWith(['dragon']);
    // The just-picked filter shows as a tag while its editor is open.
    await expect(
      canvas.getByRole('button', { name: 'Type: …' }),
    ).toHaveAttribute('aria-expanded', 'true');
  },
};

export const Applied: Story = {
  args: {
    filters: [
      {
        key: 'source',
        label: 'Source',
        summary: null,
        editor: <p>Source controls</p>,
        onClear: onClearSource,
      },
      {
        key: 'type',
        label: 'Type',
        summary: 'Dragon',
        editor: (
          <CheckboxList
            label="Type"
            options={typeOptions}
            selectedValues={['dragon']}
            onChange={onTypesChange}
          />
        ),
        onClear: onClearType,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Type: Dragon' }));
    await expect(
      screen.getByRole('checkbox', { name: 'Dragon' }),
    ).toBeChecked();

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Type filter' }),
    );
    await expect(onClearType).toHaveBeenCalledOnce();
  },
};

/** Every filter applied: there is nothing left to add. */
export const AllApplied: Story = {
  args: {
    filters: [
      {
        key: 'source',
        label: 'Source',
        summary: 'Custom',
        editor: <p>Source controls</p>,
        onClear: onClearSource,
      },
      {
        key: 'type',
        label: 'Type',
        summary: 'Dragon, Undead',
        editor: <p>Type controls</p>,
        onClear: onClearType,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.queryByRole('button', { name: '+ Filter' }),
    ).not.toBeInTheDocument();
  },
};

export const Disabled: Story = {
  args: { disabled: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: '+ Filter' }),
    ).toBeDisabled();
  },
};
