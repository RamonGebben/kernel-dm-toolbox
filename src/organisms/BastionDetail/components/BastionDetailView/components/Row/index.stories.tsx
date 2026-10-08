import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Row } from '~/organisms/BastionDetail/components/BastionDetailView/components/Row';

const meta = {
  title: 'Organisms/BastionDetail/BastionDetailView/Row',
  component: Row,
  args: {
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
