import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FacilityName } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/OrdersStep/components/FacilityName';

const meta = {
  title:
    'Organisms/BastionTurn/BastionTurnView/TurnWizard/OrdersStep/FacilityName',
  component: FacilityName,
  args: {
    children: 'Facility Name',
  },
} satisfies Meta<typeof FacilityName>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
