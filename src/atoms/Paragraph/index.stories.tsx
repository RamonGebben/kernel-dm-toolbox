import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Paragraph } from '~/atoms/Paragraph';

const meta = {
  title: 'Atoms/Paragraph',
  component: Paragraph,
  args: {
    children: 'The wall holds for another week.',
  },
} satisfies Meta<typeof Paragraph>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
