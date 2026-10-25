import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Ruleset } from '~/organisms/StatblockPanel/components/StatblockView/components/Ruleset';

const meta = {
  title: 'Organisms/StatblockPanel/StatblockView/Ruleset',
  component: Ruleset,
  args: {
    children: 'Ruleset',
  },
} satisfies Meta<typeof Ruleset>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
