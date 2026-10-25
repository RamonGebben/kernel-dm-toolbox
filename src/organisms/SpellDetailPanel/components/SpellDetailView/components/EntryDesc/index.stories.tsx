import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EntryDesc } from '~/organisms/SpellDetailPanel/components/SpellDetailView/components/EntryDesc';

const meta = {
  title: 'Organisms/SpellDetailPanel/SpellDetailView/EntryDesc',
  component: EntryDesc,
  args: {
    children: 'Entry Desc',
  },
} satisfies Meta<typeof EntryDesc>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
