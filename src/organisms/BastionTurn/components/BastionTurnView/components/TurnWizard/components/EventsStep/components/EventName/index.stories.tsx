import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EventName } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/EventsStep/components/EventName';

const meta = {
  title:
    'Organisms/BastionTurn/BastionTurnView/TurnWizard/EventsStep/EventName',
  component: EventName,
  args: {
    children: 'Event Name',
  },
} satisfies Meta<typeof EventName>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
