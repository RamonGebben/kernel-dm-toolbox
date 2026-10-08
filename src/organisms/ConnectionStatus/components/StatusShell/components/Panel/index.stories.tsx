import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Panel } from '~/organisms/ConnectionStatus/components/StatusShell/components/Panel';

const meta = {
  title: 'Organisms/ConnectionStatus/StatusShell/Panel',
  component: Panel,
  args: {
    $tone: 'neutral',
    children: 'Panel',
  },
} satisfies Meta<typeof Panel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
