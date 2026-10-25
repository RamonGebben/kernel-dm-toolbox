import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Grid } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm/components/Grid';

const meta = {
  title: 'Organisms/BastionList/BastionListView/FoundBastionForm/Grid',
  component: Grid,
  args: {
    children: 'Grid',
  },
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
