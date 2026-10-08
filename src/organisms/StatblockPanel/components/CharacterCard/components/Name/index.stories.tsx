import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Name } from '~/organisms/StatblockPanel/components/CharacterCard/components/Name';

const meta = {
  title: 'Organisms/StatblockPanel/CharacterCard/Name',
  component: Name,
  args: {
    children: 'Name',
  },
} satisfies Meta<typeof Name>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
