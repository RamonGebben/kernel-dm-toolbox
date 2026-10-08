import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Row } from '~/molecules/SpellListItem/components/Row';

const meta = {
  title: 'Molecules/SpellListItem/Row',
  component: Row,
  args: {
    $isSelected: false,
    children: 'Row',
  },
} satisfies Meta<typeof Row>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
