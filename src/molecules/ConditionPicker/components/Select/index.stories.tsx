import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Select } from '~/molecules/ConditionPicker/components/Select';

const meta = {
  title: 'Molecules/ConditionPicker/Select',
  component: Select,
  args: {
    'aria-label': 'Select',
    children: <option>Option</option>,
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
