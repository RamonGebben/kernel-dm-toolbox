import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Select } from '~/atoms/Select';

const meta = {
  title: 'Atoms/Select',
  component: Select,
  args: {
    'aria-label': 'Select',
    children: <option>Option</option>,
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
