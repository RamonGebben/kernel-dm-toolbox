import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Temporary } from '~/molecules/HitPointControls/components/Temporary';

const meta = {
  title: 'Molecules/HitPointControls/Temporary',
  component: Temporary,
  args: {
    children: 'Temporary',
  },
} satisfies Meta<typeof Temporary>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
