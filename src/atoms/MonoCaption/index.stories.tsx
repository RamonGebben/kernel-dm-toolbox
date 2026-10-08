import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MonoCaption } from '~/atoms/MonoCaption';

const meta = {
  title: 'Atoms/MonoCaption',
  component: MonoCaption,
  args: {
    children: 'CR 1/2',
  },
} satisfies Meta<typeof MonoCaption>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
