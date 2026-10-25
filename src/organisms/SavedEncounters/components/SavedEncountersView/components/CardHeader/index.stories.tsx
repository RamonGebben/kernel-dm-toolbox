import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CardHeader } from '~/organisms/SavedEncounters/components/SavedEncountersView/components/CardHeader';

const meta = {
  title: 'Organisms/SavedEncounters/SavedEncountersView/CardHeader',
  component: CardHeader,
  args: {
    children: 'Card Header',
  },
} satisfies Meta<typeof CardHeader>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
