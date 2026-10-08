import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Detail } from '~/organisms/ConnectionStatus/components/ConnectionStatusView/components/Detail';

const meta = {
  title: 'Organisms/ConnectionStatus/ConnectionStatusView/Detail',
  component: Detail,
  args: {
    children: 'Detail',
  },
} satisfies Meta<typeof Detail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
