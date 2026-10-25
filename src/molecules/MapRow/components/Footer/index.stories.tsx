import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Footer } from '~/molecules/MapRow/components/Footer';

const meta = {
  title: 'Molecules/MapRow/Footer',
  component: Footer,
  args: {
    children: 'Footer',
  },
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
