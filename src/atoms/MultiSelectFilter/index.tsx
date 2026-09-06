'use client';

import { useEffect, useId, useRef, useState } from 'react';
import styled from 'styled-components';

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
 * Not rendered through a portal, for the same reason as `Modal`: a portal
 * would put the dropdown outside the Storybook canvas element a play function
 * queries.
 */
export const MultiSelectFilter = ({
  label,
  options,
  selectedValues,
  onChange,
  disabled = false,
}: MultiSelectFilterProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) setIsOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const toggleValue = (value: string) => {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter(candidate => candidate !== value)
        : [...selectedValues, value],
    );
  };

  return (
    <Wrapper ref={wrapperRef}>
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
        <Dropdown id={listId} role="group" aria-label={label}>
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
      )}
    </Wrapper>
  );
};

const Wrapper = styled.div`
  position: relative;
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

const Dropdown = styled.div`
  position: absolute;
  top: calc(100% + ${props => props.theme.space.xs});
  left: 0;
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
