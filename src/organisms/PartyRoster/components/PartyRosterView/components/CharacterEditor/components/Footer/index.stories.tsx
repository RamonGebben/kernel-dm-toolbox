import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Footer } from '~/organisms/PartyRoster/components/PartyRosterView/components/CharacterEditor/components/Footer';

const meta = {
  title: 'Organisms/PartyRoster/PartyRosterView/CharacterEditor/Footer',
  component: Footer,
  args: {
    children: 'Footer',
  },
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
