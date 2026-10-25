import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Title } from '~/organisms/BastionDetail/components/BastionDetailView/components/Title';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/Title',
  component: Title,
  args: {
    children: 'Title',
  },
} satisfies Meta<typeof Title>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
