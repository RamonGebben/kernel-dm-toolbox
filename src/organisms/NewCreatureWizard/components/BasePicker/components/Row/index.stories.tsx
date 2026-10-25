import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Row } from '~/organisms/NewCreatureWizard/components/BasePicker/components/Row';

const meta = {
  title: 'Organisms/NewCreatureWizard/BasePicker/Row',
  component: Row,
  args: {
    children: 'Row',
  },
} satisfies Meta<typeof Row>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
