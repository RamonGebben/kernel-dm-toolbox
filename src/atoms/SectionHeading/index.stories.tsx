import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { SectionHeading } from '~/atoms/SectionHeading';
import { Button } from '~/atoms/Button';

const meta = {
  title: 'Atoms/SectionHeading',
  component: SectionHeading,
  args: { children: 'Special facilities' },
} satisfies Meta<typeof SectionHeading>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Plain: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('heading', { name: 'Special facilities' }),
    ).toBeVisible();
  },
};

export const WithAction: Story = {
  args: { action: <Button size="sm">Add</Button> },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.getByRole('button', { name: 'Add' })).toBeVisible();
  },
};
