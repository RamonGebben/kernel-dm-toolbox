import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { BoundSelect } from '~/organisms/CreatureLibrary/components/CreatureLibraryView/components/ChallengeRatingRangeFilter/components/BoundSelect';

const meta = {
  title:
    'Organisms/CreatureLibrary/CreatureLibraryView/ChallengeRatingRangeFilter/BoundSelect',
  component: BoundSelect,
  args: {
    'aria-label': 'Bound Select',
    children: <option>Option</option>,
  },
} satisfies Meta<typeof BoundSelect>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
