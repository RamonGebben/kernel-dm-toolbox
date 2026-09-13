import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { CheckboxRow, FieldRow, Select } from '~/atoms/FormControls';

/**
 * The label/input layout primitives every map-control panel composes its
 * own fields from — no props of their own, so one story demonstrates all
 * three together rather than driving a single component through args.
 */
const FormControlsDemo = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    <FieldRow>
      <label htmlFor="demo-number">Grid size (px)</label>
      <input id="demo-number" type="number" defaultValue={50} />
    </FieldRow>
    <FieldRow>
      <label htmlFor="demo-select">Mode</label>
      <Select id="demo-select" defaultValue="reveal">
        <option value="reveal">Reveal</option>
        <option value="cover">Cover</option>
      </Select>
    </FieldRow>
    <CheckboxRow>
      <input id="demo-checkbox" type="checkbox" defaultChecked />
      <label htmlFor="demo-checkbox">Show grid</label>
    </CheckboxRow>
  </div>
);

const meta = {
  title: 'Atoms/FormControls',
  component: FormControlsDemo,
} satisfies Meta<typeof FormControlsDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllControls: Story = {};
