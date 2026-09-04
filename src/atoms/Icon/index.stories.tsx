import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Icon, type IconName } from '~/atoms/Icon';

const names: IconName[] = ['swords', 'map', 'spellbook'];

const meta = {
  title: 'Atoms/Icon',
  component: Icon,
  args: { name: 'swords', size: '2rem' },
  argTypes: {
    name: { control: 'select', options: names },
    size: { control: 'text' },
  },
} satisfies Meta<typeof Icon>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Single: Story = {};

export const EveryIcon: Story = {
  render: args => (
    <div style={{ display: 'flex', gap: '1rem' }}>
      {names.map(name => (
        <Icon key={name} {...args} name={name} />
      ))}
    </div>
  ),
};
