import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Title } from '~/organisms/ConnectionStatus/components/StatusShell/components/Title';

const meta = {
  title: 'Organisms/ConnectionStatus/StatusShell/Title',
  component: Title,
  args: {
    children: 'Title',
  },
} satisfies Meta<typeof Title>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
