import { describe, expect, it } from 'vitest';
import {
  parseFormattedText,
  parseInline,
  type BlockNode,
} from '~/utils/parseFormattedText';

describe('parseInline', () => {
  it('leaves plain text alone', () => {
    expect(parseInline('1d6 Acid damage')).toEqual([
      { type: 'text', value: '1d6 Acid damage' },
    ]);
  });

  it('parses a bold header phrase', () => {
    expect(parseInline('**Audible Alarm.** The alarm rings.')).toEqual([
      { type: 'bold', children: [{ type: 'text', value: 'Audible Alarm.' }] },
      { type: 'text', value: ' The alarm rings.' },
    ]);
  });

  it('parses bold+italic', () => {
    expect(parseInline('***Weather Sensor.*** You create a sensor.')).toEqual([
      {
        type: 'boldItalic',
        children: [{ type: 'text', value: 'Weather Sensor.' }],
      },
      { type: 'text', value: ' You create a sensor.' },
    ]);
  });

  it('parses italic with either marker', () => {
    expect(parseInline('_Aquatic Adaptation._ It can breathe water.')).toEqual([
      {
        type: 'italic',
        children: [{ type: 'text', value: 'Aquatic Adaptation.' }],
      },
      { type: 'text', value: ' It can breathe water.' },
    ]);

    expect(parseInline('*Failed Save:* 12d6 Fire damage.')).toEqual([
      { type: 'italic', children: [{ type: 'text', value: 'Failed Save:' }] },
      { type: 'text', value: ' 12d6 Fire damage.' },
    ]);
  });
});

const paragraphOf = (text: string): BlockNode => ({
  type: 'paragraph',
  children: parseInline(text),
});

describe('parseFormattedText', () => {
  it('treats a plain one-line description as a single paragraph', () => {
    expect(parseFormattedText('1d6 Acid damage')).toEqual([
      paragraphOf('1d6 Acid damage'),
    ]);
  });

  it('preserves a soft line break within one paragraph', () => {
    expect(parseFormattedText('Line one.\nLine two.')).toEqual([
      paragraphOf('Line one.\nLine two.'),
    ]);
  });

  it('groups consecutive "- " lines into a single list block', () => {
    const text = [
      "- **Forbiddance:** The vampire can't enter a residence without an invitation.",
      '- **Running Water:** The vampire takes 20 Acid damage if it ends its turn in running water.',
    ].join('\n');

    expect(parseFormattedText(text)).toEqual([
      {
        type: 'list',
        items: [
          parseInline(
            "**Forbiddance:** The vampire can't enter a residence without an invitation.",
          ),
          parseInline(
            '**Running Water:** The vampire takes 20 Acid damage if it ends its turn in running water.',
          ),
        ],
      },
    ]);
  });

  it('parses a well-formed pipe table, with dice and emphasis inside a cell', () => {
    const text = [
      '| 1d8 | Ray |',
      '|---|---|',
      '| 1 | **Red.** *Failed Save:* 12d6 Fire damage. *Successful Save:* Half as much damage. |',
    ].join('\n');

    expect(parseFormattedText(text)).toEqual([
      {
        type: 'table',
        header: [parseInline('1d8'), parseInline('Ray')],
        rows: [
          [
            parseInline('1'),
            parseInline(
              '**Red.** *Failed Save:* 12d6 Fire damage. *Successful Save:* Half as much damage.',
            ),
          ],
        ],
      },
    ]);
  });

  it('degrades a malformed table (no separator row) to a plain paragraph instead of crashing', () => {
    const malformed =
      '| d10 | Behavior | | 1 | Wanders | | 2-6 | Does nothing |';

    expect(parseFormattedText(malformed)).toEqual([paragraphOf(malformed)]);
  });

  it('does not mistake embedded cross-reference tag noise for a table', () => {
    const text =
      'a 20-foot-radius Sphere [Area of Effect]|XPHB|Sphere centered on a point.';

    expect(parseFormattedText(text)).toEqual([paragraphOf(text)]);
  });

  it('separates a paragraph from a following list', () => {
    const text = [
      'The creature can use the following weaknesses.',
      '- Sunlight harms it.',
      '- Running water harms it.',
    ].join('\n');

    expect(parseFormattedText(text)).toEqual([
      paragraphOf('The creature can use the following weaknesses.'),
      {
        type: 'list',
        items: [
          parseInline('Sunlight harms it.'),
          parseInline('Running water harms it.'),
        ],
      },
    ]);
  });
});
