import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Readout } from '~/molecules/HitPointControls/components/Readout';

const meta = {
  title: 'Molecules/HitPointControls/Readout',
  component: Readout,
  args: {
    children: 'Readout',
  },
} satisfies Meta<typeof Readout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
