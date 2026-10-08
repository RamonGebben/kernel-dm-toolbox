import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tag } from '~/molecules/FilterBar/components/FilterTag/components/Tag';

const meta = {
  title: 'Molecules/FilterBar/FilterTag/Tag',
  component: Tag,
  args: {
    $isEditing: false,
    $isDisabled: false,
    children: 'Tag',
  },
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
