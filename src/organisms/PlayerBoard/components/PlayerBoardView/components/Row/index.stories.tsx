import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Row } from '~/organisms/PlayerBoard/components/PlayerBoardView/components/Row';

const meta = {
  title: 'Organisms/PlayerBoard/PlayerBoardView/Row',
  component: Row,
  args: {
    $isActive: false,
    children: 'Row',
  },
  decorators: [
    Story => (
      <ul>
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof Row>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
