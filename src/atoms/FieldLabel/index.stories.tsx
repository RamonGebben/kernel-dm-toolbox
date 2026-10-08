import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FieldLabel } from '~/atoms/FieldLabel';

const meta = {
  title: 'Atoms/FieldLabel',
  component: FieldLabel,
  args: {
    children: 'Armor Class',
  },
} satisfies Meta<typeof FieldLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
