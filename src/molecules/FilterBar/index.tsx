'use client';

import { useId, useState, type ReactNode } from 'react';
import styled from 'styled-components';
import { Portal } from '~/atoms/Portal';
import { useDismissableMenu } from '~/hooks/useDismissableMenu';
import { useFloatingPosition } from '~/hooks/useFloatingPosition';
import { FilterTag } from '~/molecules/FilterBar/components/FilterTag';

export type FilterBarFilter = {
  key: string;
  label: string;
  /** The collapsed tag's text — `null` means the filter isn't applied, so
   * it is offered under "+ Filter" instead of shown as a tag. */
  summary: string | null;
  /** The controls that set this filter, shown in the popover. */
  editor: ReactNode;
  onClear: () => void;
  disabled?: boolean;
};

export type FilterBarProps = {
  filters: readonly FilterBarFilter[];
  disabled?: boolean;
};

type Popover = { kind: 'menu' } | { kind: 'editor'; key: string } | null;

/**
 * Search-console-style filters: nothing takes room until it's applied.
 * "+ Filter" lists the filters not yet in use; picking one opens its editor,
 * and once set it collapses to a `FilterTag` that reopens the editor on
 * click and clears on ✕.
 *
 * Whether a filter is applied is derived from its `summary`, not tracked
 * here, so the parent's filter state stays the only source of truth. The one
 * piece of local state is which popover is open — a filter just picked from
 * the menu shows as a tag while its editor is open, even before it has a
 * value, and simply disappears again if closed without one.
 *
 * The popover renders through `Portal`, positioned by `useFloatingPosition`,
 * rather than as a `position: absolute` child: the bar sits inside `Panel`'s
 * scrolling body, where an ancestor's `overflow-y: auto` gets its
 * `overflow-x` promoted to `auto` too (per the CSS overflow spec), so an
 * overflowing popover would force a horizontal scrollbar onto the panel. It
 * is anchored to the whole bar rather than to whichever tag opened it, and
 * the bar is also the "inside" for click-outside, so clicking from one tag
 * to another switches editors instead of closing.
 */
export const FilterBar = ({ filters, disabled = false }: FilterBarProps) => {
  const [popover, setPopover] = useState<Popover>(null);
  const popoverId = useId();

  const editing =
    popover?.kind === 'editor'
      ? filters.find(filter => filter.key === popover.key)
      : undefined;
  // Folded into render rather than synced with an effect — no external
  // system to synchronize with, just a value derivable from props: a popover
  // whose filter became disabled (or whose whole bar did) closes instead of
  // leaving live, portalled controls behind.
  const isMenuOpen = popover?.kind === 'menu' && !disabled;
  const isEditorOpen = Boolean(editing && !editing.disabled && !disabled);
  const isOpen = isMenuOpen || isEditorOpen;

  const close = () => setPopover(null);
  const { triggerRef, menuRef } = useDismissableMenu(isOpen, close);
  const position = useFloatingPosition(isOpen, triggerRef, menuRef, 'start');

  const tags = filters.filter(
    filter =>
      filter.summary != null || (isEditorOpen && filter.key === editing?.key),
  );
  const available = filters.filter(filter => !tags.includes(filter));

  const toggleEditor = (key: string) =>
    setPopover(current =>
      current?.kind === 'editor' && current.key === key
        ? null
        : { kind: 'editor', key },
    );

  const remove = (filter: FilterBarFilter) => {
    filter.onClear();
    if (filter.key === editing?.key) close();
  };

  return (
    <Bar ref={triggerRef}>
      {tags.map(filter => (
        <FilterTag
          key={filter.key}
          label={filter.label}
          summary={filter.summary}
          isEditing={isEditorOpen && filter.key === editing?.key}
          disabled={disabled || filter.disabled}
          onEdit={() => toggleEditor(filter.key)}
          onRemove={() => remove(filter)}
        />
      ))}
      {available.length > 0 && (
        <AddButton
          type="button"
          aria-haspopup="true"
          aria-expanded={isMenuOpen}
          aria-controls={popoverId}
          disabled={disabled}
          onClick={() =>
            setPopover(current =>
              current?.kind === 'menu' ? null : { kind: 'menu' },
            )
          }
        >
          + Filter
        </AddButton>
      )}
      {isOpen && (
        <Portal>
          <Popover
            ref={menuRef}
            id={popoverId}
            style={
              position
                ? { top: `${position.top}px`, left: `${position.left}px` }
                : undefined
            }
          >
            {isMenuOpen && (
              <Menu role="group" aria-label="Add a filter">
                {available.map(filter => (
                  <MenuItem
                    key={filter.key}
                    type="button"
                    disabled={filter.disabled}
                    onClick={() =>
                      setPopover({ kind: 'editor', key: filter.key })
                    }
                  >
                    {filter.label}
                  </MenuItem>
                ))}
              </Menu>
            )}
            {isEditorOpen && editing && (
              <section aria-label={`${editing.label} filter`}>
                <Heading>{editing.label}</Heading>
                {editing.editor}
              </section>
            )}
          </Popover>
        </Portal>
      )}
    </Bar>
  );
};

const Bar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${props => props.theme.space.xs};
`;

const AddButton = styled.button`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: transparent;
  border: 1px dashed ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.pill};
  color: ${props => props.theme.color.textMuted};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.sm};
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.color.accent};
    color: ${props => props.theme.color.textPrimary};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: none;
    box-shadow: ${props => props.theme.shadow.focus};
  }
`;

/** Positioned off-screen until `useFloatingPosition` measures the bar, so
 * there is nothing to flash before its first real `top`/`left` commits. */
const Popover = styled.div`
  position: fixed;
  top: -9999px;
  left: -9999px;
  z-index: 10;
  min-width: 12rem;
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.surfaceRaised};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  box-shadow: ${props => props.theme.shadow.raised};
`;

const Menu = styled.div`
  display: flex;
  flex-direction: column;
`;

const MenuItem = styled.button`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: transparent;
  border: none;
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.sm};
  text-align: left;
  cursor: pointer;

  &:hover:not(:disabled) {
    background: ${props => props.theme.color.canvas};
    color: ${props => props.theme.color.accent};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Heading = styled.h3`
  margin: 0 0 ${props => props.theme.space.sm};
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 600;
`;
