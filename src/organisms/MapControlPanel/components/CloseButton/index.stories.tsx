import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CloseButton } from '~/organisms/MapControlPanel/components/CloseButton';

const meta = {
  title: 'Organisms/MapControlPanel/CloseButton',
  component: CloseButton,
  args: {
    children: 'Close Button',
  },
} satisfies Meta<typeof CloseButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
