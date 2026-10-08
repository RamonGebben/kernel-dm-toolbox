import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DivisorButton } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/DivisorButton';

const meta = {
  title: 'Organisms/DiceRollModal/DiceRollModalView/DivisorButton',
  component: DivisorButton,
  args: {
    $isActive: false,
    children: 'Divisor Button',
  },
} satisfies Meta<typeof DivisorButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
