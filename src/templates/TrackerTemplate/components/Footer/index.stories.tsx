import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Footer } from '~/templates/TrackerTemplate/components/Footer';

const meta = {
  title: 'Templates/TrackerTemplate/Footer',
  component: Footer,
  args: {
    children: 'Footer',
  },
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
