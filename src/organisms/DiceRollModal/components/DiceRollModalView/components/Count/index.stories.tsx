import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Count } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/Count';

const meta = {
  title: 'Organisms/DiceRollModal/DiceRollModalView/Count',
  component: Count,
  args: {
    children: 'Count',
  },
} satisfies Meta<typeof Count>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
