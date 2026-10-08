import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Body } from '~/atoms/Modal/components/Body';

const meta = {
  title: 'Atoms/Modal/Body',
  component: Body,
  args: {
    children: 'Body',
  },
} satisfies Meta<typeof Body>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
