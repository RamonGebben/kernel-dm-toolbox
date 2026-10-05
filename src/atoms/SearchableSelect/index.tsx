'use client';

import { useId, useState, type KeyboardEvent } from 'react';
import styled from 'styled-components';
import { TextInput } from '~/atoms/TextInput';
import { useDismissableMenu } from '~/hooks/useDismissableMenu';

export type SearchableSelectOption = {
  value: string;
  label: string;
};

export type SearchableSelectProps = {
  /** Both the trigger's accessible name and the leading "nothing picked"
   * row's label — the same role a native `<select>`'s blank `<option>`
   * plays, just searchable now. */
  label: string;
  placeholder: string;
  options: readonly SearchableSelectOption[];
  /** `''` means nothing is selected. */
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
};

/** Case-insensitive substring match on the option label — the same rule
 * every other filter box in this app (creatures, spells) uses. */
export const filterSearchableSelectOptions = (
  options: readonly SearchableSelectOption[],
  search: string,
): SearchableSelectOption[] => {
  const needle = search.trim().toLowerCase();
  if (!needle) return [...options];
  return options.filter(option => option.label.toLowerCase().includes(needle));
};

/**
 * A text-filterable single-select: a trigger showing the current pick, and
 * on open a search box above a live-filtered list of rows. Replaces a plain
 * `<select>` wherever the option list is long enough that scanning it beats
 * typing into it (the class/subclass pickers) — short, bounded lists keep
 * the native `<select>`.
 *
 * Not rendered through a portal, matching `MultiSelectFilter` — a portal
 * would put the dropdown outside the Storybook canvas element a play
 * function queries.
 */
export const SearchableSelect = ({
  label,
  placeholder,
  options,
  value,
  disabled = false,
  onChange,
}: SearchableSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const listId = useId();
  const wrapperRef = useDismissableMenu(isOpen, () => setIsOpen(false));

  const filtered = filterSearchableSelectOptions(options, search);
  const selectedLabel = options.find(option => option.value === value)?.label;

  const open = () => {
    setSearch('');
    setHighlightedIndex(0);
    setIsOpen(true);
  };

  const select = (nextValue: string) => {
    onChange(nextValue);
    setIsOpen(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setHighlightedIndex(current =>
        Math.min(current + 1, filtered.length - 1),
      );
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setHighlightedIndex(current => Math.max(current - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const highlighted = filtered[highlightedIndex];
      if (highlighted) select(highlighted.value);
    }
  };

  return (
    <Wrapper ref={wrapperRef}>
      <Trigger
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        aria-label={label}
        disabled={disabled}
        onClick={() => (isOpen ? setIsOpen(false) : open())}
      >
        <TriggerLabel $isPlaceholder={!selectedLabel}>
          {selectedLabel ?? placeholder}
        </TriggerLabel>
        <Caret aria-hidden="true">▾</Caret>
      </Trigger>
      {isOpen && (
        <Dropdown>
          <SearchBox
            autoFocus
            value={search}
            placeholder="Search…"
            aria-label={`Search ${label}`}
            onChange={event => {
              setSearch(event.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleKeyDown}
          />
          <List id={listId} role="listbox" aria-label={label}>
            <OptionRow
              type="button"
              role="option"
              aria-selected={value === ''}
              $isHighlighted={false}
              onClick={() => select('')}
            >
              {placeholder}
            </OptionRow>
            {filtered.map((option, index) => (
              <OptionRow
                key={option.value}
                type="button"
                role="option"
                aria-selected={option.value === value}
                $isHighlighted={index === highlightedIndex}
                onClick={() => select(option.value)}
              >
                {option.label}
              </OptionRow>
            ))}
            {filtered.length === 0 && <NoMatches>No matches</NoMatches>}
          </List>
        </Dropdown>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
  display: inline-flex;
  width: 100%;
`;

const Trigger = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${props => props.theme.space.sm};
  width: 100%;
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.color.accent};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const TriggerLabel = styled.span<{ $isPlaceholder: boolean }>`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: ${props =>
    props.$isPlaceholder ? props.theme.color.textMuted : 'inherit'};
`;

const Caret = styled.span`
  flex-shrink: 0;
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + ${props => props.theme.space.xs});
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.surfaceRaised};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  box-shadow: ${props => props.theme.shadow.raised};
`;

const SearchBox = styled(TextInput)`
  flex-shrink: 0;
`;

const List = styled.div`
  display: flex;
  flex-direction: column;
  max-height: 14rem;
  overflow-y: auto;
`;

const OptionRow = styled.button<{ $isHighlighted: boolean }>`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  background: ${props =>
    props.$isHighlighted ? props.theme.color.canvas : 'transparent'};
  border: none;
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
  text-align: left;
  cursor: pointer;

  &:hover {
    background: ${props => props.theme.color.canvas};
  }
`;

const NoMatches = styled.p`
  margin: 0;
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.sm};
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;
