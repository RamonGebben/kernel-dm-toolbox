import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Composition } from '~/organisms/SavedEncounters/components/SavedEncountersView/components/Composition';

const meta = {
  title: 'Organisms/SavedEncounters/SavedEncountersView/Composition',
  component: Composition,
  args: {
    children: 'Composition',
  },
} satisfies Meta<typeof Composition>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
