import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Label } from '~/molecules/NavigationRail/components/Label';

const meta = {
  title: 'Molecules/NavigationRail/Label',
  component: Label,
  args: {
    children: 'Label',
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
