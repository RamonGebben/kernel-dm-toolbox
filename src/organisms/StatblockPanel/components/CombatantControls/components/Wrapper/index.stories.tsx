import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Wrapper } from '~/organisms/StatblockPanel/components/CombatantControls/components/Wrapper';

const meta = {
  title: 'Organisms/StatblockPanel/CombatantControls/Wrapper',
  component: Wrapper,
  args: {
    children: 'Wrapper',
  },
} satisfies Meta<typeof Wrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
