import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BoldItalic } from '~/molecules/FormattedText/components/BoldItalic';

const meta = {
  title: 'Molecules/FormattedText/BoldItalic',
  component: BoldItalic,
  args: {
    children: 'Bold Italic',
  },
} satisfies Meta<typeof BoldItalic>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
