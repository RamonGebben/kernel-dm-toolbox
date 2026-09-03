'use client';

import styled from 'styled-components';

export type TabOption<TValue extends string> = {
  value: TValue;
  label: string;
};

type TabsProps<TValue extends string> = {
  options: readonly TabOption<TValue>[];
  value: TValue;
  onChange: (value: TValue) => void;
  label: string;
};

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

const List = styled.div`
  display: flex;
  gap: ${props => props.theme.space.xs};
`;

const Tab = styled.button<{ $isActive: boolean }>`
  padding: ${props => props.theme.space.xs} ${props => props.theme.space.md};
  background: ${props =>
    props.$isActive ? props.theme.color.accent : 'transparent'};
  border: 1px solid
    ${props =>
      props.$isActive ? props.theme.color.accent : props.theme.color.border};
  border-radius: ${props => props.theme.radius.sm};
  color: ${props =>
    props.$isActive
      ? props.theme.color.textInverted
      : props.theme.color.textMuted};
  font-family: inherit;
  font-size: ${props => props.theme.fontSize.sm};
  font-weight: 600;
  cursor: pointer;

  &:hover {
    color: ${props =>
      props.$isActive
        ? props.theme.color.textInverted
        : props.theme.color.textPrimary};
  }
`;
