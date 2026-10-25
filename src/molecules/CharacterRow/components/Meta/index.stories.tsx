import type { Meta as StoryMeta, StoryObj } from '@storybook/nextjs-vite';
import { Meta } from '~/molecules/CharacterRow/components/Meta';

const meta = {
  title: 'Molecules/CharacterRow/Meta',
  component: Meta,
  args: {
    children: 'Meta',
  },
} satisfies StoryMeta<typeof Meta>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
