import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ErrorText } from '~/organisms/BastionList/components/BastionListView/components/BastionModeSwitch/components/ErrorText';

const meta = {
  title: 'Organisms/BastionList/BastionListView/BastionModeSwitch/ErrorText',
  component: ErrorText,
  args: {
    children: 'Error Text',
  },
} satisfies Meta<typeof ErrorText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
