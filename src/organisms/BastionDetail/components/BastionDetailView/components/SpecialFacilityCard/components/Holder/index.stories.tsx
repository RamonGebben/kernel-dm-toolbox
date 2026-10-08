import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Holder } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/Holder';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/SpecialFacilityCard/Holder',
  component: Holder,
  args: {
    children: 'Holder',
  },
} satisfies Meta<typeof Holder>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
