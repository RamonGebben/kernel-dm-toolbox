import type { IconName } from '~/atoms/Icon';

/**
 * The tools this toolbox holds, in the order they appear in the nav rail.
 *
 * Static configuration, so it lives in `content/` rather than inline in the
 * rail — adding the virtual tabletop later is a row here, not a component
 * change. Only the initiative tracker is built; the other two are placeholders
 * that render disabled, because a nav item that silently does nothing is worse
 * than one that says why.
 */
export type ToolId = 'initiative' | 'maps' | 'spells';

export type Tool = {
  id: ToolId;
  label: string;
  /** Used as the tooltip and the accessible name. */
  description: string;
  icon: IconName;
  /**
   * Set only for a tool that has a route. An unbuilt tool has none, which is
   * what keeps `typedRoutes` honest — there is no href to get wrong.
   */
  href?: '/' | '/spells';
};

export const tools: readonly Tool[] = [
  {
    id: 'initiative',
    label: 'Initiative',
    description: 'Initiative tracker',
    icon: 'swords',
    href: '/',
  },
  {
    id: 'maps',
    label: 'Maps',
    description: 'Battle maps and the second screen — not built yet',
    icon: 'map',
  },
  {
    id: 'spells',
    label: 'Spells',
    description: 'Quick spell lookup',
    icon: 'spellbook',
    href: '/spells',
  },
] as const;
