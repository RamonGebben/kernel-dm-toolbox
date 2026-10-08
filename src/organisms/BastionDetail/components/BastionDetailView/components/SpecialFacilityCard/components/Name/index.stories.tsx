import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Name } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/Name';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/SpecialFacilityCard/Name',
  component: Name,
  args: {
    children: 'Name',
  },
} satisfies Meta<typeof Name>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
