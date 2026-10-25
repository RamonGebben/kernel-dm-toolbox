import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { QuantityInput } from '~/organisms/BastionDetail/components/BastionDetailView/components/StorageSection/components/QuantityInput';

const meta = {
  title:
    'Organisms/BastionDetail/BastionDetailView/StorageSection/QuantityInput',
  component: QuantityInput,
  args: {
    'aria-label': 'Quantity Input',
  },
} satisfies Meta<typeof QuantityInput>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
