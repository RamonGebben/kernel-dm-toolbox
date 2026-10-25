import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BuildForm } from '~/organisms/BastionDetail/components/BastionDetailView/components/BasicFacilitiesSection/components/BuildForm';

const meta = {
  title:
    'Organisms/BastionDetail/BastionDetailView/BasicFacilitiesSection/BuildForm',
  component: BuildForm,
  args: {
    children: 'Build Form',
  },
} satisfies Meta<typeof BuildForm>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
