import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { WallInput } from '~/organisms/BastionDetail/components/BastionDetailView/components/DefensesSection/components/WallInput';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/DefensesSection/WallInput',
  component: WallInput,
  args: {
    'aria-label': 'Wall Input',
  },
} satisfies Meta<typeof WallInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
