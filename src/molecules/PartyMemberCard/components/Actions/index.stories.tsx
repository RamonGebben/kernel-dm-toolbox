import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Actions } from '~/molecules/PartyMemberCard/components/Actions';

const meta = {
  title: 'Molecules/PartyMemberCard/Actions',
  component: Actions,
  args: {
    children: 'Actions',
  },
} satisfies Meta<typeof Actions>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
