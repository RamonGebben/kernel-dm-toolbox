import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Row } from '~/molecules/CombatantRow/components/Row';

const meta = {
  title: 'Molecules/CombatantRow/Row',
  component: Row,
  args: {
    $isSelected: false,
    $isActive: false,
    $isDown: false,
    children: 'Row',
  },
} satisfies Meta<typeof Row>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
