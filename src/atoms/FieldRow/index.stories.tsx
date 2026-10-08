import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FieldRow } from '~/atoms/FieldRow';

const meta = {
  title: 'Atoms/FieldRow',
  component: FieldRow,
  args: {
    children: 'Field Row',
  },
} satisfies Meta<typeof FieldRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
