import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Grid } from '~/molecules/CharacterForm/components/Grid';

const meta = {
  title: 'Molecules/CharacterForm/Grid',
  component: Grid,
  args: {
    $columns: 1,
    children: 'Grid',
  },
} satisfies Meta<typeof Grid>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
