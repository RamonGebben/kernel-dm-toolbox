import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Body } from '~/molecules/FilterBar/components/FilterTag/components/Body';

const meta = {
  title: 'Molecules/FilterBar/FilterTag/Body',
  component: Body,
  args: {
    children: 'Body',
  },
} satisfies Meta<typeof Body>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
