import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Title } from '~/atoms/Panel/components/Title';

const meta = {
  title: 'Atoms/Panel/Title',
  component: Title,
  args: {
    children: 'Title',
  },
} satisfies Meta<typeof Title>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
