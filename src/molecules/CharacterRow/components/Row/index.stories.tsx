import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Row } from '~/molecules/CharacterRow/components/Row';

const meta = {
  title: 'Molecules/CharacterRow/Row',
  component: Row,
  args: {
    children: 'Row',
  },
} satisfies Meta<typeof Row>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
