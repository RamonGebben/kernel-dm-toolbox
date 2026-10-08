import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Body } from '~/atoms/Panel/components/Body';

const meta = {
  title: 'Atoms/Panel/Body',
  component: Body,
  args: {
    $isScrollable: false,
    children: 'Body',
  },
} satisfies Meta<typeof Body>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
