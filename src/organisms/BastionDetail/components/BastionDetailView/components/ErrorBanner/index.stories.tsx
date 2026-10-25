import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ErrorBanner } from '~/organisms/BastionDetail/components/BastionDetailView/components/ErrorBanner';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/ErrorBanner',
  component: ErrorBanner,
  args: {
    children: 'Error Banner',
  },
} satisfies Meta<typeof ErrorBanner>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
