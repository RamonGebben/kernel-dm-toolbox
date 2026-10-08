import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { StyledButton } from '~/atoms/Button/components/StyledButton';

const meta = {
  title: 'Atoms/Button/StyledButton',
  component: StyledButton,
  args: {
    $variant: 'primary',
    $size: 'sm',
    $isFullWidth: false,
    children: 'Styled Button',
  },
} satisfies Meta<typeof StyledButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
