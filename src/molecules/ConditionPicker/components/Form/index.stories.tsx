import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Form } from '~/molecules/ConditionPicker/components/Form';

const meta = {
  title: 'Molecules/ConditionPicker/Form',
  component: Form,
  args: {
    children: 'Form',
  },
} satisfies Meta<typeof Form>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
