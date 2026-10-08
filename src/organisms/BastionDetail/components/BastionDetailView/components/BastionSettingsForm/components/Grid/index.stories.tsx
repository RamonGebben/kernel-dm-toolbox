import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Grid } from '~/organisms/BastionDetail/components/BastionDetailView/components/BastionSettingsForm/components/Grid';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/BastionSettingsForm/Grid',
  component: Grid,
  args: {
    children: 'Grid',
  },
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
