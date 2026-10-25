import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MutedParagraph } from '~/atoms/MutedParagraph';

const meta = {
  title: 'Atoms/MutedParagraph',
  component: MutedParagraph,
  args: {
    children: 'Nothing here yet.',
  },
} satisfies Meta<typeof MutedParagraph>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
