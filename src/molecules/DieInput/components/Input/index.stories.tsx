import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Input } from '~/molecules/DieInput/components/Input';

const meta = {
  title: 'Molecules/DieInput/Input',
  component: Input,
  args: {
    'aria-label': 'Input',
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
