import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Field } from '~/molecules/InitiativeRollForm/components/Field';

const meta = {
  title: 'Molecules/InitiativeRollForm/Field',
  component: Field,
  args: {
    children: 'Field',
  },
} satisfies Meta<typeof Field>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
