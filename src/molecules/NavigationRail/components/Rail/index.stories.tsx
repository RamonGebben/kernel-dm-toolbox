import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Rail } from '~/molecules/NavigationRail/components/Rail';

const meta = {
  title: 'Molecules/NavigationRail/Rail',
  component: Rail,
  args: {
    'aria-label': 'Rail',
    children: 'Rail',
  },
} satisfies Meta<typeof Rail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
