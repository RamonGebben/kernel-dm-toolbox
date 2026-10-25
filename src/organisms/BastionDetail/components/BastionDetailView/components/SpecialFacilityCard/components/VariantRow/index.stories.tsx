import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { VariantRow } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/VariantRow';

const meta = {
  title:
    'Organisms/BastionDetail/BastionDetailView/SpecialFacilityCard/VariantRow',
  component: VariantRow,
  args: {
    children: 'Variant Row',
  },
} satisfies Meta<typeof VariantRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
