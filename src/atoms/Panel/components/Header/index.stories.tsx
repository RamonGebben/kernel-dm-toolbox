import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Header } from '~/atoms/Panel/components/Header';

const meta = {
  title: 'Atoms/Panel/Header',
  component: Header,
  args: {
    children: 'Header',
  },
} satisfies Meta<typeof Header>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
