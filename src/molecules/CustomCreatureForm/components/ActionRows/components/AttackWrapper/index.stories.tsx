import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { AttackWrapper } from '~/molecules/CustomCreatureForm/components/ActionRows/components/AttackWrapper';

const meta = {
  title: 'Molecules/CustomCreatureForm/ActionRows/AttackWrapper',
  component: AttackWrapper,
  args: {
    children: 'Attack Wrapper',
  },
} satisfies Meta<typeof AttackWrapper>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
