import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Text } from '~/organisms/BastionTurn/components/BastionTurnView/components/Text';

const meta = {
  title: 'Organisms/BastionTurn/BastionTurnView/Text',
  component: Text,
  args: {
    children: 'Text',
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
