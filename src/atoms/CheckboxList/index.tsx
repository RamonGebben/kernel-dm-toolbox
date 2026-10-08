'use client';

import { List } from '~/atoms/CheckboxList/components/List';
import { Option } from '~/atoms/CheckboxList/components/Option';

export interface CheckboxListOption {
  value: string;
  label: string;
}

export interface CheckboxListProps {
  label: string;
  options: ReadonlyArray<CheckboxListOption>;
  selectedValues: ReadonlyArray<string>;
  onChange: (values: Array<string>) => void;
  disabled?: boolean;
}

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
