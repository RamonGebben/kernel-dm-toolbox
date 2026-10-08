import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Warning } from '~/organisms/PartyRoster/components/PartyRosterView/components/CharacterEditor/components/Warning';

const meta = {
  title: 'Organisms/PartyRoster/PartyRosterView/CharacterEditor/Warning',
  component: Warning,
  args: {
    children: 'Warning',
  },
} satisfies Meta<typeof Warning>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
