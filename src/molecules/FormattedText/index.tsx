'use client';

import { Fragment, type ReactNode } from 'react';
import styled from 'styled-components';
import { tokenizeDiceText } from '~/utils/tokenizeDiceText';
import {
  parseFormattedText,
  type BlockNode,
  type InlineNode,
} from '~/utils/parseFormattedText';
import { useDiceRollStore } from '~/stores/diceRoll';

export type FormattedTextProps = {
  text: string;
  /**
   * Only true for text rendered inside the statblock panel (tracker-only) —
   * lets a rolled result be applied to combatants. Never set from spell text.
   */
  canApplyToCombatants?: boolean;
};

type RenderContext = {
  canApplyToCombatants: boolean;
  openDiceRoll: ReturnType<typeof useDiceRollStore.getState>['openDiceRoll'];
};

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
          <ListItem key={index}>{renderInline(item, context)}</ListItem>
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

const renderInline = (nodes: InlineNode[], context: RenderContext): ReactNode =>
  nodes.map((node, index) => {
    if (node.type === 'text') {
      return (
        <Fragment key={index}>{renderDiceText(node.value, context)}</Fragment>
      );
    }

    const children = renderInline(node.children, context);
    if (node.type === 'bold') return <Bold key={index}>{children}</Bold>;
    if (node.type === 'italic') return <Italic key={index}>{children}</Italic>;
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

const DiceToken = styled.button`
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  color: ${props => props.theme.color.accent};
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.color.accentHover};
  }
`;

const Paragraph = styled.p`
  margin: 0 0 ${props => props.theme.space.xs};

  &:last-child {
    margin-bottom: 0;
  }
`;

const List = styled.ul`
  margin: 0 0 ${props => props.theme.space.xs};
  padding-left: ${props => props.theme.space.lg};

  &:last-child {
    margin-bottom: 0;
  }
`;

const ListItem = styled.li``;

const Table = styled.table`
  width: 100%;
  margin: 0 0 ${props => props.theme.space.xs};
  border-collapse: collapse;
  font-size: ${props => props.theme.fontSize.sm};

  &:last-child {
    margin-bottom: 0;
  }
`;

const Th = styled.th`
  padding: ${props => props.theme.space.xs};
  border: 1px solid ${props => props.theme.color.border};
  color: ${props => props.theme.color.accent};
  text-align: left;
`;

const Td = styled.td`
  padding: ${props => props.theme.space.xs};
  border: 1px solid ${props => props.theme.color.border};
  vertical-align: top;
`;

const Bold = styled.strong``;

const Italic = styled.em``;

const BoldItalic = styled.strong`
  font-style: italic;
`;
