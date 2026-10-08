import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Row } from '~/organisms/TrackerOverlayBoard/components/TrackerOverlayBoardView/components/Row';

const meta = {
  title: 'Organisms/TrackerOverlayBoard/TrackerOverlayBoardView/Row',
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
