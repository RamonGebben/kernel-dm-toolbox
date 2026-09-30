'use client';

import styled from 'styled-components';

export type CheckboxListOption = {
  value: string;
  label: string;
};

export type CheckboxListProps = {
  label: string;
  options: readonly CheckboxListOption[];
  selectedValues: readonly string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
};

/**
 * A labelled group of checkboxes over a set of string values — the body of
 * any multi-choice filter in a `FilterBar` popover. Scrolls past a fixed height, so a
 * long list (creature types, books) never pushes its container off screen.
 */
export const CheckboxList = ({
  label,
  options,
  selectedValues,
  onChange,
  disabled = false,
}: CheckboxListProps) => {
  const toggleValue = (value: string) => {
    onChange(
      selectedValues.includes(value)
        ? selectedValues.filter(candidate => candidate !== value)
        : [...selectedValues, value],
    );
  };

  return (
    <List role="group" aria-label={label}>
      {options.map(option => (
        <Option key={option.value}>
          <input
            type="checkbox"
            checked={selectedValues.includes(option.value)}
            onChange={() => toggleValue(option.value)}
            disabled={disabled}
          />
          {option.label}
        </Option>
      ))}
    </List>
  );
};

const List = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${props => props.theme.space.xs};
  max-height: 16rem;
  overflow-y: auto;
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
