import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Section } from '~/organisms/DiceRollModal/components/DiceRollModalView/components/Section';

const meta = {
  title: 'Organisms/DiceRollModal/DiceRollModalView/Section',
  component: Section,
  args: {
    children: 'Section',
  },
} satisfies Meta<typeof Section>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
