import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, screen } from 'storybook/test';
import { Portal } from '~/atoms/Portal';

const meta = {
  title: 'Atoms/Portal',
  component: Portal,
  args: {
    children: <p>Portalled content</p>,
  },
} satisfies Meta<typeof Portal>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The whole point: the content renders in the document, but outside the
 * story's own canvas subtree. */
export const RendersOutsideTheCanvas: Story = {
  play: async ({ canvasElement }) => {
    const portalled = screen.getByText('Portalled content');

    await expect(portalled).toBeVisible();
    expect(canvasElement.contains(portalled)).toBe(false);
  },
};
