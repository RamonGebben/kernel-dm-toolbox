import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AbilityKey } from '~/organisms/StatblockPanel/components/StatblockView/components/AbilityKey';

const meta = {
  title: 'Organisms/StatblockPanel/StatblockView/AbilityKey',
  component: AbilityKey,
  args: {
    children: 'Ability Key',
  },
  decorators: [
    Story => (
      <dl>
        <Story />
        <dd>Detail</dd>
      </dl>
    ),
  ],
} satisfies Meta<typeof AbilityKey>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
