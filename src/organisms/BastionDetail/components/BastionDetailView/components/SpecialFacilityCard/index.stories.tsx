import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { SpecialFacilityCard } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard';
import { specialFacilityByKey } from '~/content/bastion/specialFacilities';

const fromCatalog = (key: string, overrides = {}) => {
  const definition = specialFacilityByKey[key]!;

  return {
    id: `${key}-1`,
    facilityKey: key,
    name: definition.name,
    level: definition.level,
    order: definition.order,
    space: definition.space,
    variant: null,
    variantOptions: definition.variant ?? null,
    hirelings: definition.hirelings,
    benefits: definition.benefits,
    orderOptions: definition.orderOptions,
    enlarge: definition.enlarge
      ? {
          costGp: definition.enlarge.costGp,
          summary: definition.enlarge.summary,
        }
      : null,
    isBeingEnlarged: false,
    holder: { id: 'sigrid', name: 'Sigrid' },
    job: null,
    isOutOfAction: false,
    ...overrides,
  };
};

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/SpecialFacilityCard',
  component: SpecialFacilityCard,
  args: {
    facility: fromCatalog('arcane-study'),
    showHolder: false,
    treasuryGold: 5000,
    onSetVariant: fn(),
    onEnlarge: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof SpecialFacilityCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const ArcaneStudy: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Roomy · 1 hireling · Craft')).toBeVisible();
    await expect(canvas.getByText('Arcane Focus')).toBeVisible();
    // Cannot be enlarged: no button.
    await expect(
      canvas.queryByRole('button', { name: /Enlarge/ }),
    ).not.toBeInTheDocument();
  },
};

/** Between bastion turns: what it was set to, and how long is left. */
export const Working: Story = {
  args: {
    facility: fromCatalog('arcane-study', {
      job: {
        label: 'Magic item (Arcana)',
        note: 'Wand of Magic Missiles',
        daysRemaining: 13,
      },
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText(
        /Working on Magic item \(Arcana\) \(Wand of Magic Missiles\) — 13 days left/,
      ),
    ).toBeVisible();
  },
};

export const OutOfAction: Story = {
  args: { facility: fromCatalog('arcane-study', { isOutOfAction: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByText('Out of action for the next bastion turn'),
    ).toBeVisible();
  },
};

/** In a party bastion each card says whose it is. */
export const InAPartyBastion: Story = {
  args: { showHolder: true },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText('Held by Sigrid')).toBeVisible();
  },
};

export const ChoosingAGardenType: Story = {
  args: { facility: fromCatalog('garden') },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(canvas.getByLabelText(/type/i), 'Herb');

    await expect(args.onSetVariant).toHaveBeenCalledWith('Herb');
  },
};

export const Enlarging: Story = {
  args: { facility: fromCatalog('barrack') },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', {
        name: /Enlarge to Vast \(2,000 gp, 80 days\)/,
      }),
    );

    await expect(args.onEnlarge).toHaveBeenCalledOnce();
  },
};

export const CannotAffordToEnlarge: Story = {
  args: { facility: fromCatalog('barrack'), treasuryGold: 1999 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: /Enlarge to Vast/ }),
    ).toBeDisabled();
  },
};

export const BeingEnlarged: Story = {
  args: { facility: fromCatalog('barrack', { isBeingEnlarged: true }) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Being enlarged/)).toBeVisible();
  },
};

export const Removing: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Arcane Study' }),
    );
    await userEvent.click(
      canvas.getByRole('button', { name: 'Remove Arcane Study' }),
    );

    await expect(args.onRemove).toHaveBeenCalledOnce();
  },
};
