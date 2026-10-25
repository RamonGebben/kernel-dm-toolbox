import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Results } from '~/organisms/NewCreatureWizard/components/BasePicker/components/Results';

const meta = {
  title: 'Organisms/NewCreatureWizard/BasePicker/Results',
  component: Results,
  args: {
    children: 'Results',
  },
} satisfies Meta<typeof Results>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
