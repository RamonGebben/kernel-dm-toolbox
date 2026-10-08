import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Footer } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/Footer';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/SpecialFacilityCard/Footer',
  component: Footer,
  args: {
    children: 'Footer',
  },
} satisfies Meta<typeof Footer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
