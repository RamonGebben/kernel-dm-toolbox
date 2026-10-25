import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { OptionLabel } from '~/organisms/BastionDetail/components/BastionDetailView/components/SpecialFacilityCard/components/OptionLabel';

const meta = {
  title:
    'Organisms/BastionDetail/BastionDetailView/SpecialFacilityCard/OptionLabel',
  component: OptionLabel,
  args: {
    children: 'Option Label',
  },
} satisfies Meta<typeof OptionLabel>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
