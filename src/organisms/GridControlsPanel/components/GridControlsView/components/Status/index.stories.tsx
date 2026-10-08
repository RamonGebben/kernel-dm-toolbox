import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Status } from '~/organisms/GridControlsPanel/components/GridControlsView/components/Status';

const meta = {
  title: 'Organisms/GridControlsPanel/GridControlsView/Status',
  component: Status,
  args: {
    children: 'Status',
  },
} satisfies Meta<typeof Status>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
