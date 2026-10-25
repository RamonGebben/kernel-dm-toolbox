import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Columns } from '~/atoms/Columns';

const meta = {
  title: 'Atoms/Columns',
  component: Columns,
  args: {
    $columns: 'minmax(0, 1fr) minmax(0, 2fr)',
    children: 'Columns',
  },
} satisfies Meta<typeof Columns>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
