import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Desc } from '~/organisms/SpellDetailPanel/components/SpellDetailView/components/Desc';

const meta = {
  title: 'Organisms/SpellDetailPanel/SpellDetailView/Desc',
  component: Desc,
  args: {
    children: 'Desc',
  },
} satisfies Meta<typeof Desc>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
