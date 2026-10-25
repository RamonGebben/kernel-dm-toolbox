import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ToggleLabel } from '~/molecules/CustomCreatureForm/components/ToggleLabel';

const meta = {
  title: 'Molecules/CustomCreatureForm/ToggleLabel',
  component: ToggleLabel,
  args: {
    children: 'Toggle Label',
  },
} satisfies Meta<typeof ToggleLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
