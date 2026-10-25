import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Th } from '~/molecules/FormattedText/components/Th';

const meta = {
  title: 'Molecules/FormattedText/Th',
  component: Th,
  args: {
    children: 'Th',
  },
  decorators: [
    Story => (
      <table>
        <thead>
          <tr>
            <Story />
          </tr>
        </thead>
      </table>
    ),
  ],
} satisfies Meta<typeof Th>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
