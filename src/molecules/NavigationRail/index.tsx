'use client';

import Link from 'next/link';
import { Icon } from '~/atoms/Icon';
import type { Tool, ToolId } from '~/content/tools';
import { Rail } from '~/molecules/NavigationRail/components/Rail';
import { List } from '~/molecules/NavigationRail/components/List';
import { Slot } from '~/molecules/NavigationRail/components/Slot';
import { Label } from '~/molecules/NavigationRail/components/Label';

export interface NavigationRailProps {
  tools: ReadonlyArray<Tool>;
  /** Which tool the current route belongs to. */
  activeToolId: ToolId;
}

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

interface ToolButtonProps {
  tool: Tool;
  isActive: boolean;
}

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
        aria-label={`${tool.label} (coming soon)`}
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
