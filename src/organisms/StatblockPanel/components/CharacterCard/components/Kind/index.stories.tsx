import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Kind } from '~/organisms/StatblockPanel/components/CharacterCard/components/Kind';

const meta = {
  title: 'Organisms/StatblockPanel/CharacterCard/Kind',
  component: Kind,
  args: {
    children: 'Kind',
  },
} satisfies Meta<typeof Kind>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
