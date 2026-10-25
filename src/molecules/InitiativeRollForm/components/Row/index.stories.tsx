import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Row } from '~/molecules/InitiativeRollForm/components/Row';

const meta = {
  title: 'Molecules/InitiativeRollForm/Row',
  component: Row,
  args: {
    children: 'Row',
  },
} satisfies Meta<typeof Row>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
