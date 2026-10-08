import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EditLink } from '~/molecules/CharacterRow/components/EditLink';

const meta = {
  title: 'Molecules/CharacterRow/EditLink',
  component: EditLink,
  args: {
    href: '/',
    children: 'Edit Link',
  },
} satisfies Meta<typeof EditLink>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
