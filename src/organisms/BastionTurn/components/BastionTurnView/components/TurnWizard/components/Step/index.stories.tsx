import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Step } from '~/organisms/BastionTurn/components/BastionTurnView/components/TurnWizard/components/Step';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/TurnWizard/Step',
  component: Step,
  args: {
    $state: 'current',
    children: 'Step',
  },
  decorators: [
    Story => (
      <ul>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof Step>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
