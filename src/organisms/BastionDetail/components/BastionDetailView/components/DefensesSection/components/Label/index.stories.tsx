import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Label } from '~/organisms/BastionDetail/components/BastionDetailView/components/DefensesSection/components/Label';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/DefensesSection/Label',
  component: Label,
  args: {
    children: 'Label',
  },
} satisfies Meta<typeof Label>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
