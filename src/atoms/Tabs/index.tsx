'use client';

import { List } from '~/atoms/Tabs/components/List';
import { Tab } from '~/atoms/Tabs/components/Tab';

export interface TabOption<TValue extends string> {
  value: TValue;
  label: string;
}

interface TabsProps<TValue extends string> {
  options: ReadonlyArray<TabOption<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
  label: string;
}

export const Tabs = <TValue extends string>({
  options,
  value,
  onChange,
  label,
}: TabsProps<TValue>) => (
  <List role="tablist" aria-label={label}>
    {options.map(option => (
      <Tab
        key={option.value}
        role="tab"
        type="button"
        aria-selected={option.value === value}
        $isActive={option.value === value}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </Tab>
    ))}
  </List>
);
