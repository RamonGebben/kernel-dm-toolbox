'use client';

import Link from 'next/link';
import styled, { css } from 'styled-components';
import { Icon } from '~/atoms/Icon';
import type { Tool, ToolId } from '~/content/tools';

export type NavigationRailProps = {
  tools: readonly Tool[];
  /** Which tool the current route belongs to. */
  activeToolId: ToolId;
};

/**
 * The vertical icon rail down the left edge, and the only navigation in the
 * app: one entry per tool.
 *
 * Presentational — the page decides which tool is active. A tool without an
 * `href` has not been built yet and renders as a disabled control rather than
 * a link, so it is visible on the rail without pretending to go anywhere.
 */
export const NavigationRail = ({
  tools,
  activeToolId,
}: NavigationRailProps) => (
  <Rail aria-label="Tools">
    <List>
      {tools.map(tool => (
        <li key={tool.id}>
          <ToolButton tool={tool} isActive={tool.id === activeToolId} />
        </li>
      ))}
    </List>
  </Rail>
);

type ToolButtonProps = {
  tool: Tool;
  isActive: boolean;
};

/**
 * A real named subcomponent rather than a ternary in the map, so the built and
 * unbuilt cases stay two readable branches.
 */
const ToolButton = ({ tool, isActive }: ToolButtonProps) => {
  if (!tool.href) {
    return (
      <Slot
        as="button"
        type="button"
        disabled
        $isActive={false}
        title={tool.description}
        aria-label={`${tool.label} — coming soon`}
      >
        <Icon name={tool.icon} />
        <Label>{tool.label}</Label>
      </Slot>
    );
  }

  return (
    <Slot
      as={Link}
      href={tool.href}
      $isActive={isActive}
      title={tool.description}
      aria-label={tool.description}
      aria-current={isActive ? 'page' : undefined}
    >
      <Icon name={tool.icon} />
      <Label>{tool.label}</Label>
    </Slot>
  );
};

const Rail = styled.nav`
  display: flex;
  flex-direction: column;
  padding: ${props => props.theme.space.md} ${props => props.theme.space.sm};
  background: ${props => props.theme.color.surface};
  border-right: 1px solid ${props => props.theme.color.border};
`;

const List = styled.ul`
  display: flex;
  flex-direction: row;
  gap: ${props => props.theme.space.xs};
  margin: 0;
  padding: 0;
  list-style: none;

  /* A rail on a laptop, a strip across the top of a tablet. */
  ${props => props.theme.media.lg} {
    flex-direction: column;
  }
`;

const Slot = styled.a<{ $isActive: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${props => props.theme.space.xs};
  width: 4rem;
  padding: ${props => props.theme.space.sm} ${props => props.theme.space.xs};
  border: 1px solid transparent;
  border-radius: ${props => props.theme.radius.sm};
  background: transparent;
  color: ${props => props.theme.color.textMuted};
  font-family: inherit;
  text-decoration: none;
  cursor: pointer;

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    color: ${props => props.theme.color.textPrimary};
    background: ${props => props.theme.color.surfaceRaised};
  }

  ${props =>
    props.$isActive &&
    css`
      color: ${props.theme.color.accent};
      border-color: ${props.theme.color.accentMuted};
      background: ${props.theme.color.surfaceRaised};
    `}
`;

const Label = styled.span`
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 600;
  letter-spacing: 0.02em;
`;
