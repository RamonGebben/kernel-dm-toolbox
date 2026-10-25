import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MenuDivider } from '~/molecules/MapRow/components/MenuDivider';

const meta = {
  title: 'Molecules/MapRow/MenuDivider',
  component: MenuDivider,
} satisfies Meta<typeof MenuDivider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
