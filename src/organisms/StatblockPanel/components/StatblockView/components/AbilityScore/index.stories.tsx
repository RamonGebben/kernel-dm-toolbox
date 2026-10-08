import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AbilityScore } from '~/organisms/StatblockPanel/components/StatblockView/components/AbilityScore';

const meta = {
  title: 'Organisms/StatblockPanel/StatblockView/AbilityScore',
  component: AbilityScore,
  args: {
    children: 'Ability Score',
  },
  decorators: [
    Story => (
      <dl>
        <dt>Term</dt>
        <Story />
      </dl>
    ),
  ],
} satisfies Meta<typeof AbilityScore>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
