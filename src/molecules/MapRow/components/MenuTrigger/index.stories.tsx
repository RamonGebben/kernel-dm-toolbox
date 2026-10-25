import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MenuTrigger } from '~/molecules/MapRow/components/MenuTrigger';

const meta = {
  title: 'Molecules/MapRow/MenuTrigger',
  component: MenuTrigger,
  args: {
    children: 'Menu Trigger',
  },
} satisfies Meta<typeof MenuTrigger>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
