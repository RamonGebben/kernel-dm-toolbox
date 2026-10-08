import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Event } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/EventsStep/components/Event';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/EventsStep/Event',
  component: Event,
  args: {
    children: 'Event',
  },
} satisfies Meta<typeof Event>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
