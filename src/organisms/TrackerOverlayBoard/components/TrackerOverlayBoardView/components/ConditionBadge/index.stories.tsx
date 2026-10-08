import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ConditionBadge } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/ConditionBadge';

const meta = {
  title: 'Organisms/TrackerOverlayBoard/TrackerOverlayBoardView/ConditionBadge',
  component: ConditionBadge,
  args: {
    children: 'Condition Badge',
  },
} satisfies Meta<typeof ConditionBadge>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
