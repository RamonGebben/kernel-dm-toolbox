import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Abilities } from '~/organisms/StatblockPanel/components/StatblockView/components/Abilities';

const meta = {
  title: 'Organisms/StatblockPanel/StatblockView/Abilities',
  component: Abilities,
  args: {
    children: (
      <>
        <dt>Term</dt>
        <dd>Detail</dd>
      </>
    ),
  },
} satisfies Meta<typeof Abilities>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
