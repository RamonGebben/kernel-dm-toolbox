import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Row } from '~/molecules/MapRow/components/Row';

const meta = {
  title: 'Molecules/MapRow/Row',
  component: Row,
  args: {
    $isLoaded: false,
    children: 'Row',
  },
} satisfies Meta<typeof Row>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
