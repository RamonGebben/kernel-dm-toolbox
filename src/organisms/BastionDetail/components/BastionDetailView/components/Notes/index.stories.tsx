import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Notes } from '~/organisms/BastionDetail/components/BastionDetailView/components/Notes';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/Notes',
  component: Notes,
  args: {
    children: 'Notes',
  },
} satisfies Meta<typeof Notes>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
