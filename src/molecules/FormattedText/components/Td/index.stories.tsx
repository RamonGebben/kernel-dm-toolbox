import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Td } from '~/molecules/FormattedText/components/Td';

const meta = {
  title: 'Molecules/FormattedText/Td',
  component: Td,
  args: {
    children: 'Td',
  },
  decorators: [
    Story => (
      <table>
        <tbody>
          <tr>
            <Story />
          </tr>
        </tbody>
      </table>
    ),
  ],
} satisfies Meta<typeof Td>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
