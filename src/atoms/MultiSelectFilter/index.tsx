'use client';

import { useId, useState } from 'react';
import styled from 'styled-components';
import { Portal } from '~/atoms/Portal';
import { useDismissableMenu } from '~/hooks/useDismissableMenu';
import { useFloatingPosition } from '~/hooks/useFloatingPosition';

export type MultiSelectFilterOption = {
  value: string;
  label: string;
};

export type MultiSelectFilterProps = {
  label: string;
  options: readonly MultiSelectFilterOption[];
  selectedValues: readonly string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
};

/**
 * A trigger button that opens a checkbox list, for a filter where several
 * values can apply at once — several spell levels, several classes — unlike
 * the single-choice `<select>` `ConditionPicker` uses.
 *
 * The checkbox list renders through `Portal`, positioned against the trigger
 * by `useFloatingPosition`, rather than as a `position: absolute` child of
 * the trigger — this used to sit inside `Panel`'s scrolling body, where an
 * ancestor's `overflow-y: auto` gets its `overflow-x` promoted to `auto` too
 * (per the CSS overflow spec), so an overflowing dropdown forced a real
 * horizontal scrollbar onto the panel rather than just getting clipped.
 */
export const MultiSelectFilter = ({
  label,
  options,
  selectedValues,
  onChange,
  disabled = false,
}: MultiSelectFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const listId = useId();
  const { triggerRef, menuRef } = useDismissableMenu(isOpen, () =>
    setIsOpen(false),
  );
  const position = useFloatingPosition(isOpen, triggerRef, menuRef, 'start');

  const toggleValue = (value: string) => {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter(candidate => candidate !== value)
        : [...selectedValues, value],
    );
  };

  return (
    <Wrapper ref={triggerRef}>
      <Trigger
        type="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls={listId}
        $isActive={selectedValues.length > 0}
        disabled={disabled}
        onClick={() => setIsOpen(current => !current)}
      >
        {label}
        {selectedValues.length > 0 ? ` (${selectedValues.length})` : ''}
        <Caret aria-hidden="true">▾</Caret>
      </Trigger>
      {isOpen && (
        <Portal>
          <Dropdown
            ref={menuRef}
            id={listId}
            role="group"
            aria-label={label}
            style={
              position
                ? { top: `${position.top}px`, left: `${position.left}px` }
                : undefined
            }
          >
            {options.map(option => (
              <Option key={option.value}>
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={() => toggleValue(option.value)}
                />
                {option.label}
              </Option>
            ))}
          </Dropdown>
        </Portal>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: inline-flex;
`;

const Trigger = styled.button<{ $isActive: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: ${props => props.theme.space.xs};
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.canvas};
  border: 1px solid
    ${props =>
      props.$isActive ? props.theme.color.accent : props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props => props.theme.color.textPrimary};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.md};
  white-space: nowrap;
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${props => props.theme.color.accent};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Caret = styled.span`
  color: ${props => props.theme.color.textMuted};
  font-size: ${props => props.theme.fontSize.sm};
`;

/** Positioned off-screen until `useFloatingPosition` measures the trigger,
 * so there is nothing to flash before its first real `top`/`left` commits. */
const Dropdown = styled.div`
  position: fixed;
  top: -9999px;
  left: -9999px;
  z-index: 10;
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  min-width: 12rem;
  max-height: 16rem;
  overflow-y: auto;
  padding: ${props => props.theme.space.sm};
  background: ${props => props.theme.color.surfaceRaised};
  border: 1px solid ${props => props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  box-shadow: ${props => props.theme.shadow.raised};
`;

const Option = styled.label`
  display: flex;
  align-items: center;
  gap: ${props => props.theme.space.sm};
  color: ${props => props.theme.color.textPrimary};
  font-size: ${props => props.theme.fontSize.sm};
  cursor: pointer;

  &:hover {
    color: ${props => props.theme.color.accent};
  }
`;
