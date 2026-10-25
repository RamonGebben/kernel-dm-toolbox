import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Scrim } from '~/atoms/Modal/components/Scrim';

const meta = {
  title: 'Atoms/Modal/Scrim',
  component: Scrim,
  args: {
    children: 'Scrim',
  },
} satisfies Meta<typeof Scrim>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
