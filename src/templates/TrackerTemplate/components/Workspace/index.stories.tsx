import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Workspace } from '~/templates/TrackerTemplate/components/Workspace';

const meta = {
  title: 'Templates/TrackerTemplate/Workspace',
  component: Workspace,
  args: {
    children: 'Workspace',
  },
} satisfies Meta<typeof Workspace>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
