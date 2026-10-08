import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CheckboxRow } from '~/atoms/CheckboxRow';

const meta = {
  title: 'Atoms/CheckboxRow',
  component: CheckboxRow,
  args: {
    children: 'Checkbox Row',
  },
} satisfies Meta<typeof CheckboxRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
