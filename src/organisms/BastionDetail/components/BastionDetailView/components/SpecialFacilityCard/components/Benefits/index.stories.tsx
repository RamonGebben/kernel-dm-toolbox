import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Benefits } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/Benefits';

const meta = {
  title:
    'Organisms/BastionDetail/BastionDetailView/SpecialFacilityCard/Benefits',
  component: Benefits,
  args: {
    children: <li>Item</li>,
  },
} satisfies Meta<typeof Benefits>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
