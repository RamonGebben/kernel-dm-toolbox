import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Total } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/Total';

const meta = {
  title: 'Organisms/DiceRollModal/DiceRollModalView/Total',
  component: Total,
  args: {
    children: 'Total',
  },
} satisfies Meta<typeof Total>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
