import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DiceToken } from '~/molecules/FormattedText/components/DiceToken';

const meta = {
  title: 'Molecules/FormattedText/DiceToken',
  component: DiceToken,
  args: {
    children: 'Dice Token',
  },
} satisfies Meta<typeof DiceToken>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
