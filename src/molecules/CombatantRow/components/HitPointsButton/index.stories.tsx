import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { HitPointsButton } from '~/molecules/CombatantRow/components/HitPointsButton';

const meta = {
  title: 'Molecules/CombatantRow/HitPointsButton',
  component: HitPointsButton,
  args: {
    $tone: 'full',
    children: 'Hit Points Button',
  },
} satisfies Meta<typeof HitPointsButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
