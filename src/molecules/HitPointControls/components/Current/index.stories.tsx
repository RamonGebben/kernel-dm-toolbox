import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Current } from '~/molecules/HitPointControls/components/Current';

const meta = {
  title: 'Molecules/HitPointControls/Current',
  component: Current,
  args: {
    children: 'Current',
  },
} satisfies Meta<typeof Current>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
