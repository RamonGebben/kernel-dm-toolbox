import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, within } from 'storybook/test';
import { NavigationRail } from '~/molecules/NavigationRail';
import { tools } from '~/content/tools';

const meta = {
  title: 'Molecules/NavigationRail',
  component: NavigationRail,
  args: { tools, activeToolId: 'initiative' },
  argTypes: {
    activeToolId: {
      control: 'select',
      options: tools.map(tool => tool.id),
    },
  },
} satisfies Meta<typeof NavigationRail>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('link', { name: 'Initiative tracker' }),
    ).toHaveAttribute('aria-current', 'page');
  },
};

/** The unbuilt tools are on the rail but cannot be clicked into nothing. */
export const UnbuiltToolsAreDisabled: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(
      canvas.getByRole('button', { name: 'Maps — coming soon' }),
    ).toBeDisabled();
    await expect(
      canvas.getByRole('button', { name: 'Spells — coming soon' }),
    ).toBeDisabled();
  },
};
