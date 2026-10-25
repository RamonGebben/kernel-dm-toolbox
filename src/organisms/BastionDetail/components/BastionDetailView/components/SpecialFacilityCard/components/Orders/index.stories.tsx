import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Orders } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/Orders';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/SpecialFacilityCard/Orders',
  component: Orders,
  args: {
    children: <li>Item</li>,
  },
} satisfies Meta<typeof Orders>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
