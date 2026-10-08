import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DoneTitle } from '~/organisms/BastionTurn/components/BastionTurnView/components/DoneTitle';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/DoneTitle',
  component: DoneTitle,
  args: {
    children: 'Done Title',
  },
} satisfies Meta<typeof DoneTitle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
