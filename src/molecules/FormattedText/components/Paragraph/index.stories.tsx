import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Paragraph } from '~/molecules/FormattedText/components/Paragraph';

const meta = {
  title: 'Molecules/FormattedText/Paragraph',
  component: Paragraph,
  args: {
    children: 'Paragraph',
  },
} satisfies Meta<typeof Paragraph>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
