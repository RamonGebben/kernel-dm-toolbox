import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MemberRooms } from '~/organisms/BastionList/components/BastionListView/components/FoundBastionForm/components/MemberRooms';

const meta = {
  title: 'Organisms/BastionList/BastionListView/FoundBastionForm/MemberRooms',
  component: MemberRooms,
  args: {
    children: 'Member Rooms',
  },
} satisfies Meta<typeof MemberRooms>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
