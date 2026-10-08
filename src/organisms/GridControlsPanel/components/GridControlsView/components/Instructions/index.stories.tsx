import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Instructions } from '~/organisms/GridControlsPanel/components/GridControlsView/components/Instructions';

const meta = {
  title: 'Organisms/GridControlsPanel/GridControlsView/Instructions',
  component: Instructions,
  args: {
    children: 'Instructions',
  },
} satisfies Meta<typeof Instructions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
