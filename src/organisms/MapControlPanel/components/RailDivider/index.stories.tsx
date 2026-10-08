import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { RailDivider } from '~/organisms/MapControlPanel/components/RailDivider';

const meta = {
  title: 'Organisms/MapControlPanel/RailDivider',
  component: RailDivider,
} satisfies Meta<typeof RailDivider>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
