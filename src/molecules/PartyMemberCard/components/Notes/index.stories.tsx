import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Notes } from '~/molecules/PartyMemberCard/components/Notes';

const meta = {
  title: 'Molecules/PartyMemberCard/Notes',
  component: Notes,
  args: {
    children: 'Notes',
  },
} satisfies Meta<typeof Notes>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
