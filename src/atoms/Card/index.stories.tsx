import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Card } from '~/atoms/Card';

const meta = {
  title: 'Atoms/Card',
  component: Card,
  args: {
    children: 'Card',
  },
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
