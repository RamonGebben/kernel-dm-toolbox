import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ManageLink } from '~/organisms/CharacterRoster/components/CharacterRosterView/components/ManageLink';

const meta = {
  title: 'Organisms/CharacterRoster/CharacterRosterView/ManageLink',
  component: ManageLink,
  args: {
    href: '/',
    children: 'Manage Link',
  },
} satisfies Meta<typeof ManageLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
