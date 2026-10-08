import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Panel } from '~/atoms/Modal/components/Panel';

const meta = {
  title: 'Atoms/Modal/Panel',
  component: Panel,
  args: {
    $isWide: false,
    children: 'Panel',
  },
} satisfies Meta<typeof Panel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
