import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { FillStack } from '~/atoms/FillStack';

const meta = {
  title: 'Atoms/FillStack',
  component: FillStack,
  args: {
    children: (
      <>
        <span>First</span>
        <span>Second</span>
      </>
    ),
  },
} satisfies Meta<typeof FillStack>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
