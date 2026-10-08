import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Dice } from '~/molecules/DieInput/components/Dice';

const meta = {
  title: 'Molecules/DieInput/Dice',
  component: Dice,
  args: {
    children: 'Dice',
  },
} satisfies Meta<typeof Dice>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
