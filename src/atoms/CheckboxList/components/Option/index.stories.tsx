import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Option } from '~/atoms/CheckboxList/components/Option';

const meta = {
  title: 'Atoms/CheckboxList/Option',
  component: Option,
  args: {
    children: 'Option',
  },
} satisfies Meta<typeof Option>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
