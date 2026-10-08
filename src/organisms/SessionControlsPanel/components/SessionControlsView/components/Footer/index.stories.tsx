import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Footer } from '~/organisms/SessionControlsPanel/components/SessionControlsView/components/Footer';

const meta = {
  title: 'Organisms/SessionControlsPanel/SessionControlsView/Footer',
  component: Footer,
  args: {
    children: 'Footer',
  },
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
