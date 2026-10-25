import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Header } from '~/organisms/BastionDetail/components/BastionDetailView/components/Header';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/Header',
  component: Header,
  args: {
    children: 'Header',
  },
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
