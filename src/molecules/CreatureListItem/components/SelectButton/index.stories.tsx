import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SelectButton } from '~/molecules/CreatureListItem/components/SelectButton';

const meta = {
  title: 'Molecules/CreatureListItem/SelectButton',
  component: SelectButton,
  args: {
    children: 'Select Button',
  },
} satisfies Meta<typeof SelectButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
