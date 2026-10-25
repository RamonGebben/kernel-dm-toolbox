import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { LevelHeading } from '~/organisms/BastionDetail/components/BastionDetailView/components/FacilityPicker/components/LevelHeading';

const meta = {
  title:
    'Organisms/BastionDetail/BastionDetailView/FacilityPicker/LevelHeading',
  component: LevelHeading,
  args: {
    children: 'Level Heading',
  },
} satisfies Meta<typeof LevelHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
