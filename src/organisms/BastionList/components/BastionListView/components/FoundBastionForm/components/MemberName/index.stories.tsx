import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MemberName } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm/components/MemberName';

const meta = {
  title: 'Organisms/BastionList/BastionListView/FoundBastionForm/MemberName',
  component: MemberName,
  args: {
    children: 'Member Name',
  },
  decorators: [
    Story => (
      <fieldset>
        <Story />
      </fieldset>
    ),
  ],
} satisfies Meta<typeof MemberName>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
