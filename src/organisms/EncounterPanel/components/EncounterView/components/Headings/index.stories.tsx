import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Headings } from '~/organisms/EncounterPanel/components/EncounterView/components/Headings';

const meta = {
  title: 'Organisms/EncounterPanel/EncounterView/Headings',
  component: Headings,
  args: {
    children: 'Headings',
  },
} satisfies Meta<typeof Headings>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
