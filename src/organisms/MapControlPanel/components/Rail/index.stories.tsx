import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Rail } from '~/organisms/MapControlPanel/components/Rail';

const meta = {
  title: 'Organisms/MapControlPanel/Rail',
  component: Rail,
  args: {
    'aria-label': 'Rail',
    children: 'Rail',
  },
} satisfies Meta<typeof Rail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
