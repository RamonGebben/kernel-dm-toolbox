import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tag } from '~/molecules/InitiativeRollForm/components/Tag';

const meta = {
  title: 'Molecules/InitiativeRollForm/Tag',
  component: Tag,
  args: {
    children: 'Tag',
  },
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
