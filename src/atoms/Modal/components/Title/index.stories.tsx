import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Title } from '~/atoms/Modal/components/Title';

const meta = {
  title: 'Atoms/Modal/Title',
  component: Title,
  args: {
    children: 'Title',
  },
} satisfies Meta<typeof Title>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
