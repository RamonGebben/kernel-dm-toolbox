import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ClassSelect } from '~/molecules/CharacterForm/components/ClassSelect';

const meta = {
  title: 'Molecules/CharacterForm/ClassSelect',
  component: ClassSelect,
  args: {
    'aria-label': 'Class Select',
    children: <option>Option</option>,
  },
} satisfies Meta<typeof ClassSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
