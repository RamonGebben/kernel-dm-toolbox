import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StyledAnchor } from '~/molecules/OpenPlayerScreenLink/components/StyledAnchor';

const meta = {
  title: 'Molecules/OpenPlayerScreenLink/StyledAnchor',
  component: StyledAnchor,
  args: {
    href: '#',
    children: 'Styled Anchor',
  },
} satisfies Meta<typeof StyledAnchor>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
