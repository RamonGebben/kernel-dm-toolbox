import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Footer } from '~/organisms/CreatureLibrary/components/CreatureLibraryView/components/Footer';

const meta = {
  title: 'Organisms/CreatureLibrary/CreatureLibraryView/Footer',
  component: Footer,
  args: {
    children: 'Footer',
  },
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
