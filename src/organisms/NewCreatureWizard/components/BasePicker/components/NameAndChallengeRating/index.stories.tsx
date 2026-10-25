import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { NameAndChallengeRating } from '~/organisms/NewCreatureWizard/components/BasePicker/components/NameAndChallengeRating';

const meta = {
  title: 'Organisms/NewCreatureWizard/BasePicker/NameAndChallengeRating',
  component: NameAndChallengeRating,
  args: {
    children: 'Name And Challenge Rating',
  },
} satisfies Meta<typeof NameAndChallengeRating>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
