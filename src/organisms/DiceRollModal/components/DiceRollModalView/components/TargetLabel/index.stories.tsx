import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TargetLabel } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/TargetLabel';

const meta = {
  title: 'Organisms/DiceRollModal/DiceRollModalView/TargetLabel',
  component: TargetLabel,
  args: {
    children: 'Target Label',
  },
} satisfies Meta<typeof TargetLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
