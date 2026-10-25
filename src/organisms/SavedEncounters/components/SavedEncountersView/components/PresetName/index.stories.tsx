import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PresetName } from '~/organisms/SavedEncounters/components/SavedEncountersView/components/PresetName';

const meta = {
  title: 'Organisms/SavedEncounters/SavedEncountersView/PresetName',
  component: PresetName,
  args: {
    children: 'Preset Name',
  },
} satisfies Meta<typeof PresetName>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
