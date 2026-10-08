import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Content } from '~/organisms/LibraryPanel/components/Content';

const meta = {
  title: 'Organisms/LibraryPanel/Content',
  component: Content,
  args: {
    children: 'Content',
  },
} satisfies Meta<typeof Content>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
