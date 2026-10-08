import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Stats } from '~/molecules/PartyMemberCard/components/Stats';

const meta = {
  title: 'Molecules/PartyMemberCard/Stats',
  component: Stats,
  args: {
    children: (
      <>
        <dt>Term</dt>
        <dd>Detail</dd>
      </>
    ),
  },
} satisfies Meta<typeof Stats>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
