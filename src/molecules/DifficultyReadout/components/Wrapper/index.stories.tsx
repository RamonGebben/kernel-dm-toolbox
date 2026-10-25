import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Wrapper } from '~/molecules/DifficultyReadout/components/Wrapper';

const meta = {
  title: 'Molecules/DifficultyReadout/Wrapper',
  component: Wrapper,
  args: {
    children: 'Wrapper',
  },
} satisfies Meta<typeof Wrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
