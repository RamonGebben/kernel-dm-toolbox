import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { expect, userEvent, within } from 'storybook/test';
import { FormattedText } from '~/molecules/FormattedText';
import { useDiceRollStore } from '~/stores/diceRoll';

const meta = {
  title: 'Molecules/FormattedText',
  component: FormattedText,
  args: {
    text: 'You take 13 (2d6 + 6) Slashing damage.',
    canApplyToCombatants: false,
  },
} satisfies Meta<typeof FormattedText>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AverageAndParentheticalDice: Story = {};

export const PlainDice: Story = {
  args: { text: 'You take 3d6 Bludgeoning damage.' },
};

export const ModifierAtVaryingSpacing: Story = {
  args: {
    text: '10d6 + 40 Force damage, or 8d6+4 if you failed the save.',
  },
};

export const BareAndPercentileDice: Story = {
  args: {
    text: 'Roll a d20. The GM rolls 1d100 and consults the outcome table.',
  },
};

export const MultipleMentionsInOneSentence: Story = {
  args: {
    text: '31 (9d6) Fire damage plus 31 (9d6) Force damage.',
  },
};

export const BoldActionHeader: Story = {
  args: {
    text: '**Clenched Fist.** The hand strikes one target. Hit: 5d8 Force damage.',
  },
};

export const BoldItalicHeader: Story = {
  args: {
    text: '***Weather Sensor.*** You create a Tiny, harmless sensory effect that predicts the weather.',
  },
};

export const ItalicLabel: Story = {
  args: {
    text: '_Aquatic Adaptation._ *Failed Save:* 12d6 Fire damage. *Successful Save:* Half as much damage.',
  },
};

export const BulletList: Story = {
  args: {
    text: [
      "- **Forbiddance:** The vampire can't enter a residence without an invitation.",
      '- **Running Water:** The vampire takes 20 Acid damage if it ends its turn in running water.',
    ].join('\n'),
  },
};

export const PipeTableWithDiceAndEmphasis: Story = {
  args: {
    text: [
      '| 1d8 | Ray |',
      '|---|---|',
      '| 1 | **Red.** *Failed Save:* 12d6 Fire damage. *Successful Save:* Half as much damage. |',
      '| 2 | **Orange.** *Failed Save:* 10d6 Acid damage. *Successful Save:* Half as much damage. |',
    ].join('\n'),
  },
};

export const MalformedTableDegradesToPlainText: Story = {
  args: {
    text: '| d10 | Behavior | | 1 | Wanders | | 2-6 | Does nothing |',
  },
};

export const ClickingATokenOpensTheRollStore: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const token = canvas.getByRole('button', { name: 'Roll 2d6 + 6' });

    await userEvent.click(token);

    await expect(useDiceRollStore.getState().dice).toMatchObject({
      expression: '2d6 + 6',
      count: 2,
      sides: 6,
      modifier: 6,
      canApplyToCombatants: false,
    });

    useDiceRollStore.getState().closeDiceRoll();
  },
};

export const ClickingATokenInsideATableCellStillWorks: Story = {
  args: {
    text: [
      '| 1d8 | Ray |',
      '|---|---|',
      '| 1 | **Red.** *Failed Save:* 12d6 Fire damage. |',
    ].join('\n'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await userEvent.click(canvas.getByRole('button', { name: 'Roll 1d8' }));
    await expect(useDiceRollStore.getState().dice).toMatchObject({
      expression: '1d8',
    });
    useDiceRollStore.getState().closeDiceRoll();

    await userEvent.click(canvas.getByRole('button', { name: 'Roll 12d6' }));
    await expect(useDiceRollStore.getState().dice).toMatchObject({
      expression: '12d6',
    });
    useDiceRollStore.getState().closeDiceRoll();
  },
};
