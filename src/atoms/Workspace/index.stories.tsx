import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Workspace } from '~/atoms/Workspace';

const meta = {
  title: 'Atoms/Workspace',
  component: Workspace,
  args: {
    children: 'Workspace content',
  },
} satisfies Meta<typeof Workspace>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
