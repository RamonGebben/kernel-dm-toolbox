import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Table } from '~/molecules/FormattedText/components/Table';

const meta = {
  title: 'Molecules/FormattedText/Table',
  component: Table,
  args: {
    children: (
      <tbody>
        <tr>
          <td>Cell</td>
        </tr>
      </tbody>
    ),
  },
} satisfies Meta<typeof Table>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
