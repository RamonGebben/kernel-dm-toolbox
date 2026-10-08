import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Round } from '~/organisms/EncounterPanel/components/EncounterView/components/Round';

const meta = {
  title: 'Organisms/EncounterPanel/EncounterView/Round',
  component: Round,
  args: {
    children: 'Round',
  },
} satisfies Meta<typeof Round>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
