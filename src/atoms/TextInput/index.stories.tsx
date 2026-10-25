import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TextInput } from '~/atoms/TextInput';

const meta = {
  title: 'Atoms/TextInput',
  component: TextInput,
  args: {
    'aria-label': 'Name',
    placeholder: 'Name',
  },
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
