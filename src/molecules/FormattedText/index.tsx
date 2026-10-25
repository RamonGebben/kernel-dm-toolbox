'use client';

import { Fragment, type ReactNode } from 'react';
import { tokenizeDiceText } from '~/utils/tokenizeDiceText';
import {
  parseFormattedText,
  type BlockNode,
  type InlineNode,
} from '~/utils/parseFormattedText';
import { useDiceRollStore } from '~/store/diceRoll';
import { DiceToken } from '~/molecules/FormattedText/components/DiceToken';
import { Paragraph } from '~/molecules/FormattedText/components/Paragraph';
import { List } from '~/molecules/FormattedText/components/List';
import { Table } from '~/molecules/FormattedText/components/Table';
import { Th } from '~/molecules/FormattedText/components/Th';
import { Td } from '~/molecules/FormattedText/components/Td';
import { BoldItalic } from '~/molecules/FormattedText/components/BoldItalic';

export interface FormattedTextProps {
  text: string;
  /**
   * Only true for text rendered inside the statblock panel (tracker-only) —
   * lets a rolled result be applied to combatants. Never set from spell text.
   */
  canApplyToCombatants?: boolean;
}

interface RenderContext {
  canApplyToCombatants: boolean;
  openDiceRoll: ReturnType<typeof useDiceRollStore.getState>['openDiceRoll'];
}

/**
 * Renders spell/creature prose: the narrow markdown subset actually present
 * upstream (bold, italic, bold+italic, single-level lists, rare pipe
 * tables), with every dice expression ("8d6 + 4", "d20", …) inside it —
 * including inside a table cell or an emphasis span — as a clickable inline
 * token that opens the roll modal.
 */
export const FormattedText = ({
  text,
  canApplyToCombatants = false,
}: FormattedTextProps) => {
  const openDiceRoll = useDiceRollStore(state => state.openDiceRoll);
  const context: RenderContext = { canApplyToCombatants, openDiceRoll };

  return (
    <>
      {parseFormattedText(text).map((block, index) => (
        <Fragment key={index}>{renderBlock(block, context)}</Fragment>
      ))}
    </>
  );
};

const renderBlock = (block: BlockNode, context: RenderContext): ReactNode => {
  if (block.type === 'paragraph') {
    return <Paragraph>{renderInline(block.children, context)}</Paragraph>;
  }

  if (block.type === 'list') {
    return (
      <List>
        {block.items.map((item, index) => (
          <li key={index}>{renderInline(item, context)}</li>
        ))}
      </List>
    );
  }

  return (
    <Table>
      <thead>
        <tr>
          {block.header.map((cell, index) => (
            <Th key={index}>{renderInline(cell, context)}</Th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.rows.map((row, rowIndex) => (
          <tr key={rowIndex}>
            {row.map((cell, cellIndex) => (
              <Td key={cellIndex}>{renderInline(cell, context)}</Td>
            ))}
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

const renderInline = (
  nodes: Array<InlineNode>,
  context: RenderContext,
): ReactNode =>
  nodes.map((node, index) => {
    if (node.type === 'text') {
      return (
        <Fragment key={index}>{renderDiceText(node.value, context)}</Fragment>
      );
    }

    const children = renderInline(node.children, context);
    if (node.type === 'bold') return <strong key={index}>{children}</strong>;
    if (node.type === 'italic') return <em key={index}>{children}</em>;
    return <BoldItalic key={index}>{children}</BoldItalic>;
  });

const renderDiceText = (value: string, context: RenderContext): ReactNode =>
  tokenizeDiceText(value).map((segment, index) => {
    if (segment.type === 'text') {
      return <Fragment key={index}>{segment.value}</Fragment>;
    }

    return (
      <DiceToken
        key={index}
        type="button"
        aria-label={`Roll ${segment.value}`}
        onClick={() =>
          context.openDiceRoll({
            expression: segment.value,
            count: segment.count,
            sides: segment.sides,
            modifier: segment.modifier,
            canApplyToCombatants: context.canApplyToCombatants,
          })
        }
      >
        {segment.value}
      </DiceToken>
    );
  });
