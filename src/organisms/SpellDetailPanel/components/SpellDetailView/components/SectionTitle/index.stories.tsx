import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SectionTitle } from '~/organisms/SpellDetailPanel/components/SpellDetailView/components/SectionTitle';

const meta = {
  title: 'Organisms/SpellDetailPanel/SpellDetailView/SectionTitle',
  component: SectionTitle,
  args: {
    children: 'Section Title',
  },
} satisfies Meta<typeof SectionTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
