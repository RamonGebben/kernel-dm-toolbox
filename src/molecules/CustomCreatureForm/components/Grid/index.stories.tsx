import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Grid } from '~/molecules/CustomCreatureForm/components/Grid';

const meta = {
  title: 'Molecules/CustomCreatureForm/Grid',
  component: Grid,
  args: {
    $columns: 4,
    children: 'Grid',
  },
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
