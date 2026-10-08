import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MutedInline } from '~/atoms/MutedInline';

const meta = {
  title: 'Atoms/MutedInline',
  component: MutedInline,
  args: {
    children: 'CR 5',
  },
} satisfies Meta<typeof MutedInline>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
