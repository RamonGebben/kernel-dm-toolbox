import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Heading } from '~/molecules/FilterBar/components/Heading';

const meta = {
  title: 'Molecules/FilterBar/Heading',
  component: Heading,
  args: {
    children: 'Heading',
  },
} satisfies Meta<typeof Heading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
