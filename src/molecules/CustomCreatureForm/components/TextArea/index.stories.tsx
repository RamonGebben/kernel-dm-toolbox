import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { TextArea } from '~/molecules/CustomCreatureForm/components/TextArea';

const meta = {
  title: 'Molecules/CustomCreatureForm/TextArea',
  component: TextArea,
  args: {
    'aria-label': 'Text Area',
  },
} satisfies Meta<typeof TextArea>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
