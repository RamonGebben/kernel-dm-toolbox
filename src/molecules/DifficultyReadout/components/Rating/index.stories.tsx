import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Rating } from '~/molecules/DifficultyReadout/components/Rating';

const meta = {
  title: 'Molecules/DifficultyReadout/Rating',
  component: Rating,
  args: {
    $difficulty: 'moderate',
    children: 'Rating',
  },
} satisfies Meta<typeof Rating>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
