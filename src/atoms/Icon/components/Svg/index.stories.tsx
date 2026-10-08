import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Svg } from '~/atoms/Icon/components/Svg';

const meta = {
  title: 'Atoms/Icon/Svg',
  component: Svg,
  args: {
    $size: '4rem',
  },
} satisfies Meta<typeof Svg>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
