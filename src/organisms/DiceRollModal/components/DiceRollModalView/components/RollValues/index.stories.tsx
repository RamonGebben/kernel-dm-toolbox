import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RollValues } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/RollValues';

const meta = {
  title: 'Organisms/DiceRollModal/DiceRollModalView/RollValues',
  component: RollValues,
  args: {
    children: 'Roll Values',
  },
} satisfies Meta<typeof RollValues>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
