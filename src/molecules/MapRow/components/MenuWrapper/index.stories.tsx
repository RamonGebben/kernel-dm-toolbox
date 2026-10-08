import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MenuWrapper } from '~/molecules/MapRow/components/MenuWrapper';

const meta = {
  title: 'Molecules/MapRow/MenuWrapper',
  component: MenuWrapper,
  args: {
    children: 'Menu Wrapper',
  },
} satisfies Meta<typeof MenuWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
