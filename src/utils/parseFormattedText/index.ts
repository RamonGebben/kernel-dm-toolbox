export type InlineNode =
  | { type: 'text'; value: string }
  | { type: 'bold'; children: InlineNode[] }
  | { type: 'italic'; children: InlineNode[] }
  | { type: 'boldItalic'; children: InlineNode[] };

export type BlockNode =
  | { type: 'paragraph'; children: InlineNode[] }
  | { type: 'list'; items: InlineNode[][] }
  | { type: 'table'; header: InlineNode[][]; rows: InlineNode[][][] };

/**
 * The markdown actually present in imported Open5e text, surveyed across the
 * whole SRD 2024 dataset: `**bold**`, `***bold italic***`, `*italic*`/
 * `_italic_`, single-level `- ` lists, and rare (7 of 2340 fields) pipe
 * tables. No headers, links, blockquotes, `__bold__`, `* ` list items, or
 * ordered lists appear anywhere, so this intentionally does not parse them.
 */
const INLINE_PATTERN = /\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|_(.+?)_/g;

/** Bold/italic emphasis within one line of text. Recurses so nested emphasis (unseen in the data, but cheap to support) still resolves. */
export const parseInline = (text: string): InlineNode[] => {
  const nodes: InlineNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(INLINE_PATTERN)) {
    const index = match.index;
    if (index > lastIndex) {
      nodes.push({ type: 'text', value: text.slice(lastIndex, index) });
    }

    const [full, boldItalic, bold, italicStar, italicUnderscore] = match;
    if (boldItalic !== undefined) {
      nodes.push({ type: 'boldItalic', children: parseInline(boldItalic) });
    } else if (bold !== undefined) {
      nodes.push({ type: 'bold', children: parseInline(bold) });
    } else {
      nodes.push({
        type: 'italic',
        children: parseInline((italicStar ?? italicUnderscore)!),
      });
    }

    lastIndex = index + full.length;
  }

  if (lastIndex < text.length) {
    nodes.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return nodes;
};

const LIST_ITEM = /^- +(.*)$/;
const TABLE_ROW = /^\|(.*)\|\s*$/;

/** A separator row like `|---|---|` or `| :-- | --: |` — only dashes/colons/space per cell. */
const isTableSeparatorRow = (line: string): boolean => {
  const match = line.match(TABLE_ROW);
  if (!match) return false;

  const cells = match[1].split('|');
  return cells.every(cell => /^[\s:-]+$/.test(cell));
};

const parseTableRow = (line: string): InlineNode[][] =>
  line
    .match(TABLE_ROW)![1]
    .split('|')
    .map(cell => parseInline(cell.trim()));

const isTableStart = (lines: readonly string[], index: number): boolean =>
  TABLE_ROW.test(lines[index]) &&
  index + 1 < lines.length &&
  isTableSeparatorRow(lines[index + 1]);

/**
 * Splits free-form prose into paragraph/list/table blocks.
 *
 * A malformed table (Confusion's is collapsed onto a single line upstream,
 * with no separator row) simply never matches `isTableStart` and falls
 * through to a plain paragraph instead — degrading gracefully rather than
 * producing a garbled table.
 */
export const parseFormattedText = (text: string): BlockNode[] => {
  const lines = text.split('\n');
  const blocks: BlockNode[] = [];
  let index = 0;

  while (index < lines.length) {
    if (lines[index].trim() === '') {
      index += 1;
      continue;
    }

    if (LIST_ITEM.test(lines[index])) {
      const items: InlineNode[][] = [];
      while (index < lines.length) {
        const match = lines[index].match(LIST_ITEM);
        if (!match) break;
        items.push(parseInline(match[1].trim()));
        index += 1;
      }
      blocks.push({ type: 'list', items });
      continue;
    }

    if (isTableStart(lines, index)) {
      const header = parseTableRow(lines[index]);
      index += 2; // header + separator
      const rows: InlineNode[][][] = [];
      while (index < lines.length && TABLE_ROW.test(lines[index])) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }
      blocks.push({ type: 'table', header, rows });
      continue;
    }

    const paragraphLines: string[] = [];
    while (
      index < lines.length &&
      lines[index].trim() !== '' &&
      !LIST_ITEM.test(lines[index]) &&
      !isTableStart(lines, index)
    ) {
      paragraphLines.push(lines[index]);
      index += 1;
    }
    blocks.push({
      type: 'paragraph',
      children: parseInline(paragraphLines.join('\n')),
    });
  }

  return blocks;
};
