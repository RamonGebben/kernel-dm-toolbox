import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TextArea } from '~/atoms/TextArea';

const meta = {
  title: 'Atoms/TextArea',
  component: TextArea,
  args: {
    'aria-label': 'Text Area',
  },
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
