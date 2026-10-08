import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MenuLabel } from '~/molecules/MapRow/components/MenuLabel';

const meta = {
  title: 'Molecules/MapRow/MenuLabel',
  component: MenuLabel,
  args: {
    children: 'Menu Label',
  },
} satisfies Meta<typeof MenuLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
