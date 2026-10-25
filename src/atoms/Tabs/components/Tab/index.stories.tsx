import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Tab } from '~/atoms/Tabs/components/Tab';

const meta = {
  title: 'Atoms/Tabs/Tab',
  component: Tab,
  args: {
    $isActive: false,
    children: 'Tab',
  },
} satisfies Meta<typeof Tab>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
