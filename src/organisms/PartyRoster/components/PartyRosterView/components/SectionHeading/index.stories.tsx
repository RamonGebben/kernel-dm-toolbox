import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SectionHeading } from '~/organisms/PartyRoster/components/PartyRosterView/components/SectionHeading';

const meta = {
  title: 'Organisms/PartyRoster/PartyRosterView/SectionHeading',
  component: SectionHeading,
  args: {
    children: 'Section Heading',
  },
} satisfies Meta<typeof SectionHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
