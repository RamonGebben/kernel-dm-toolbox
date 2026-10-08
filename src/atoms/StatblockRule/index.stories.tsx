import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StatblockRule } from '~/atoms/StatblockRule';

const meta = {
  title: 'Atoms/StatblockRule',
  component: StatblockRule,
} satisfies Meta<typeof StatblockRule>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
