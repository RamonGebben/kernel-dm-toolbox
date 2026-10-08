import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Toolbar } from '~/organisms/EncounterPanel/components/EncounterView/components/Toolbar';

const meta = {
  title: 'Organisms/EncounterPanel/EncounterView/Toolbar',
  component: Toolbar,
  args: {
    children: 'Toolbar',
  },
} satisfies Meta<typeof Toolbar>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
