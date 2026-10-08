import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Spacer } from '~/molecules/InitiativeRollForm/components/Spacer';

const meta = {
  title: 'Molecules/InitiativeRollForm/Spacer',
  component: Spacer,
  args: {
    children: 'Spacer',
  },
} satisfies Meta<typeof Spacer>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
