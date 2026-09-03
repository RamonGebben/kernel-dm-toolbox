/**
 * Static copy and configuration. No logic, no data fetching — just the values
 * the UI reads. Keeping it here rather than inline in components means copy
 * changes never touch a component file.
 */
export type NavigationItem = {
  id: string;
  label: string;
  description: string;
  /** Set when the item is behind a feature gate evaluated server-side. */
  gate?: 'initiativeTracker';
};

export const navigationItems: readonly NavigationItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    description: 'The state of this campaign instance.',
  },
  {
    id: 'initiative',
    label: 'Initiative',
    description: 'Track turn order for the encounter in play.',
    gate: 'initiativeTracker',
  },
] as const;
