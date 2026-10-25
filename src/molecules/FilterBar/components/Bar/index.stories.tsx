import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Bar } from '~/molecules/FilterBar/components/Bar';

const meta = {
  title: 'Molecules/FilterBar/Bar',
  component: Bar,
  args: {
    children: 'Bar',
  },
} satisfies Meta<typeof Bar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
