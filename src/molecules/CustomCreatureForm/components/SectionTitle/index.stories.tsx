import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SectionTitle } from '~/molecules/CustomCreatureForm/components/SectionTitle';

const meta = {
  title: 'Molecules/CustomCreatureForm/SectionTitle',
  component: SectionTitle,
  args: {
    children: 'Section Title',
  },
} satisfies Meta<typeof SectionTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
