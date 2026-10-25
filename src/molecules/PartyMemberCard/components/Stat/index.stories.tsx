import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stat } from '~/molecules/PartyMemberCard/components/Stat';

const meta = {
  title: 'Molecules/PartyMemberCard/Stat',
  component: Stat,
  args: {
    children: 'Stat',
  },
} satisfies Meta<typeof Stat>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
