import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { OrdersStep } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/OrdersStep';
import {
  SIGRID,
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

/** Every facility is there for everyone at home to order. */
export const EveryFacilityForEveryone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const hall = within(canvas.getByLabelText('Orders for The Hall'));

    await expect(hall.getByText(/giving orders: Sigrid, Wren/)).toBeVisible();
    await expect(
      hall.getByLabelText('Order for the Arcane Study'),
    ).toBeVisible();
    await expect(hall.getByLabelText('Order for the Barrack')).toBeVisible();
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

/** Sigrid gives Wren's Arcane Study its order this turn. */
export const SomeoneElseGivesTheOrder: Story = {
  args: {
    draft: turnDraft({
      step: 'orders',
      actors: turnDraft().actors.map(actor =>
        actor.characterId === WREN
          ? {
              ...actor,
              facilityOrders: [
                { facilityId: STUDY, optionKey: 'book', costGp: 10, note: '' },
              ],
            }
          : actor,
      ),
    }),
  },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.selectOptions(
      canvas.getByLabelText('Who gives the Arcane Study its order'),
      SIGRID,
    );

    await expect(args.onChange).toHaveBeenCalledWith(
      expect.objectContaining({
        actors: [
          expect.objectContaining({
            characterId: SIGRID,
            facilityOrders: [expect.objectContaining({ facilityId: STUDY })],
          }),
          expect.objectContaining({ characterId: WREN, facilityOrders: [] }),
        ],
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
