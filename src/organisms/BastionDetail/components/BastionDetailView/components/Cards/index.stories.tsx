import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Cards } from '~/organisms/BastionDetail/components/BastionDetailView/components/Cards';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/Cards',
  component: Cards,
  args: {
    children: 'Cards',
  },
} satisfies Meta<typeof Cards>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
