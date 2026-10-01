import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { OrdersStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/OrdersStep';
import {
  STUDY,
  WREN,
  turnContext,
  turnDraft,
} from '~/organisms/BastionTurn/storyFixtures';

const meta = {
  title: 'Organisms/BastionTurn/TurnWizard/OrdersStep',
  component: OrdersStep,
  args: {
    context: turnContext,
    draft: turnDraft({ step: 'orders' }),
    onChange: fn(),
  },
} satisfies Meta<typeof OrdersStep>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Each member orders only the facilities they hold. */
export const EachMembersOwnFacilities: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const wren = within(canvas.getByLabelText("Wren's orders"));

    await expect(wren.getByText('Arcane Study')).toBeVisible();
    await expect(wren.queryByText('Barrack')).not.toBeInTheDocument();
  },
};

export const GivingAnOrder: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(
      canvas.getByLabelText('Order for the Arcane Study'),
      'book',
    );

    await expect(args.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        actors: expect.arrayContaining([
          expect.objectContaining({
            characterId: WREN,
            facilityOrders: [
              { facilityId: STUDY, optionKey: 'book', costGp: 10, note: '' },
            ],
          }),
        ]),
      }),
    );
  },
};

export const OrderChosen: Story = {
  args: {
    draft: turnDraft({
      step: 'orders',
      actors: [
        {
          bastionId: turnContext.bastions[0]!.id,
          characterId: WREN,
          isPresent: true,
          maintain: false,
          facilityOrders: [
            { facilityId: STUDY, optionKey: 'book', costGp: 10, note: '' },
          ],
        },
      ],
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Makes one blank book/)).toBeVisible();
    await expect(
      canvas.getByText('Paid from the treasury: 10 gp.'),
    ).toBeVisible();
  },
};

export const EveryoneMaintains: Story = {
  args: {
    draft: turnDraft({
      step: 'orders',
      actors: turnDraft().actors.map(actor => ({ ...actor, maintain: true })),
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByText(/Nobody is giving orders/)).toBeVisible();
  },
};
